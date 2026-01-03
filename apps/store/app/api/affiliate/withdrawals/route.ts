/**
 * GET /api/affiliate/withdrawals - Get withdrawal requests
 * POST /api/affiliate/withdrawals - Create withdrawal request (user) or manage (merchant)
 */

import { NextResponse } from "next/server";
import { getMerchantCollectionForAPI, buildMerchantQuery, getMerchantIdForAPI } from "@/lib/api-helpers";
import { getCurrentUser } from "@/lib/auth";
import { ObjectId } from "mongodb";
import type { AffiliateWithdrawal, WithdrawalStatus } from "@/lib/affiliate-types";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const affiliateIdParam = searchParams.get("affiliateId");
    const status = searchParams.get("status") as WithdrawalStatus | null;

    const withdrawalsCol = await getMerchantCollectionForAPI<AffiliateWithdrawal>("affiliate_withdrawals");
    const affiliatesCol = await getMerchantCollectionForAPI("affiliates");
    const usersCol = await getMerchantCollectionForAPI("users");
    const baseQuery = await buildMerchantQuery();

    let affiliateId: string | null = null;

    if (user.role === "merchant") {
      // Merchant can view all withdrawals, or filter by specific affiliate
      if (affiliateIdParam) {
        affiliateId = affiliateIdParam;
      }
      // If no affiliateIdParam, merchant sees all withdrawals (affiliateId stays null)
    } else {
      // User can only view their own withdrawals
      const affiliate = await affiliatesCol.findOne({
        ...baseQuery,
        userId: user.id,
      });
      if (!affiliate) {
        return NextResponse.json({ withdrawals: [] });
      }
      affiliateId = String(affiliate._id);
    }

    const query: any = { ...baseQuery };
    if (affiliateId) {
      query.affiliateId = affiliateId;
    }
    if (status) {
      query.status = status;
    }

    const withdrawals = await withdrawalsCol.find(query).sort({ requestedAt: -1 }).toArray();

    // Enrich withdrawals with affiliate and user information
    const enrichedWithdrawals = await Promise.all(
      withdrawals.map(async (w) => {
        let affiliateInfo = null;
        if (w.affiliateId) {
          try {
            const affiliate = await affiliatesCol.findOne({
              ...baseQuery,
              _id: new ObjectId(w.affiliateId),
            });

            if (affiliate) {
              let userInfo = null;
              if (affiliate.userId) {
                try {
                  const user = await usersCol.findOne({
                    ...baseQuery,
                    _id: new ObjectId(affiliate.userId),
                  });
                  if (user) {
                    userInfo = {
                      fullName: user.fullName,
                      email: user.email,
                      phone: user.phone,
                    };
                  }
                } catch (error) {
                  console.error("Error fetching user for withdrawal:", error);
                }
              }

              affiliateInfo = {
                promoCode: affiliate.promoCode,
                user: userInfo,
              };
            }
          } catch (error) {
            console.error("Error fetching affiliate for withdrawal:", error);
          }
        }

        return {
          id: String(w._id),
          affiliateId: w.affiliateId,
          amount: w.amount,
          status: w.status,
          paymentMethod: w.paymentMethod,
          paymentDetails: w.paymentDetails,
          requestedAt: w.requestedAt,
          processedAt: w.processedAt,
          processedBy: w.processedBy,
          notes: w.notes,
          affiliate: affiliateInfo,
        };
      })
    );

    return NextResponse.json({
      withdrawals: enrichedWithdrawals,
    });
  } catch (error: any) {
    console.error("GET /api/affiliate/withdrawals error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch withdrawals" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, withdrawalId, status: newStatus, notes } = body;

    const withdrawalsCol = await getMerchantCollectionForAPI<AffiliateWithdrawal>("affiliate_withdrawals");
    const affiliatesCol = await getMerchantCollectionForAPI("affiliates");
    const baseQuery = await buildMerchantQuery();
    const merchantId = await getMerchantIdForAPI();

    if (action === "create" && user.role === "customer") {
      // User creating withdrawal request
      const { amount, paymentMethod, paymentDetails } = body;

      // Validate required fields
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: "Amount is required and must be greater than 0" }, { status: 400 });
      }

      if (!paymentMethod || paymentMethod.trim() === "") {
        return NextResponse.json({ error: "Payment method is required" }, { status: 400 });
      }

      // Validate payment details based on payment method
      if (!paymentDetails) {
        return NextResponse.json({ error: "Payment details are required" }, { status: 400 });
      }

      // Validate bank transfer details
      if (paymentMethod.toLowerCase().includes("bank") || paymentMethod.toLowerCase().includes("transfer")) {
        if (!paymentDetails.accountNumber || paymentDetails.accountNumber.trim() === "") {
          return NextResponse.json({ error: "Account number is required for bank transfer" }, { status: 400 });
        }
        if (!paymentDetails.bankName || paymentDetails.bankName.trim() === "") {
          return NextResponse.json({ error: "Bank name is required for bank transfer" }, { status: 400 });
        }
        if (!paymentDetails.accountName || paymentDetails.accountName.trim() === "") {
          return NextResponse.json({ error: "Account name is required for bank transfer" }, { status: 400 });
        }
        // Validate account number format (at least 8 digits)
        if (!/^\d{8,}$/.test(paymentDetails.accountNumber.replace(/\s/g, ""))) {
          return NextResponse.json({ error: "Invalid account number format" }, { status: 400 });
        }
      }

      // Validate mobile banking details
      if (
        paymentMethod.toLowerCase().includes("mobile") ||
        paymentMethod.toLowerCase().includes("bkash") ||
        paymentMethod.toLowerCase().includes("nagad") ||
        paymentMethod.toLowerCase().includes("rocket")
      ) {
        if (!paymentDetails.mobileNumber || paymentDetails.mobileNumber.trim() === "") {
          return NextResponse.json({ error: "Mobile number is required for mobile banking" }, { status: 400 });
        }
        // Validate mobile number format (should be 11 digits, starting with 01)
        const mobileNumber = paymentDetails.mobileNumber.replace(/\s/g, "");
        if (!/^01[3-9]\d{8}$/.test(mobileNumber)) {
          return NextResponse.json({ error: "Invalid mobile number format. Must be 11 digits starting with 01" }, { status: 400 });
        }
      }

      const affiliate = await affiliatesCol.findOne({
        ...baseQuery,
        userId: user.id,
      });

      if (!affiliate) {
        return NextResponse.json({ error: "Affiliate account not found" }, { status: 404 });
      }

      // Get settings to check min withdrawal
      const settingsCol = await getMerchantCollectionForAPI("affiliate_settings");
      const settings = await settingsCol.findOne(await buildMerchantQuery({ id: "affiliate_settings_v1" }));

      const minAmount = settings?.minWithdrawalAmount || 100;
      if (amount < minAmount) {
        return NextResponse.json({ error: `Minimum withdrawal amount is ${minAmount}` }, { status: 400 });
      }

      // Calculate available balance from delivered orders only
      const commissionsCol = await getMerchantCollectionForAPI("affiliate_commissions");
      const ordersCol = await getMerchantCollectionForAPI("orders");

      // Get all approved commissions (from delivered orders)
      const approvedCommissions = await commissionsCol
        .find({
          ...baseQuery,
          affiliateId: String(affiliate._id),
          status: "approved",
        })
        .toArray();

      // Verify these commissions are from delivered orders
      const approvedOrderIds = approvedCommissions.map((c) => c.orderId).filter(Boolean);
      const deliveredOrders = await ordersCol
        .find({
          ...baseQuery,
          _id: { $in: approvedOrderIds.map((id) => new ObjectId(id)) },
          status: "delivered",
        })
        .toArray();

      const deliveredOrderIds = new Set(deliveredOrders.map((o) => String(o._id)));
      const deliveredCommissions = approvedCommissions.filter((c) => deliveredOrderIds.has(c.orderId));

      // Calculate available balance from delivered orders only
      const deliveredEarnings = deliveredCommissions.reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
      const totalWithdrawn = affiliate.totalWithdrawn || 0;
      const availableBalance = deliveredEarnings - totalWithdrawn;

      // Update affiliate's availableBalance if it's incorrect (server-side validation)
      if (Math.abs((affiliate.availableBalance || 0) - availableBalance) > 0.01) {
        await affiliatesCol.updateOne({ ...baseQuery, _id: affiliate._id }, { $set: { availableBalance: availableBalance } });
        console.log(`[Withdrawals API] Corrected affiliate balance: ${affiliate.availableBalance} → ${availableBalance}`);
      }

      if (amount > availableBalance) {
        return NextResponse.json(
          {
            error: `Insufficient balance. Available: ${availableBalance.toFixed(2)} (from delivered orders only)`,
          },
          { status: 400 }
        );
      }

      // Check for pending withdrawals that would exceed balance
      const pendingWithdrawals = await withdrawalsCol
        .find({
          ...baseQuery,
          affiliateId: String(affiliate._id),
          status: "pending",
        })
        .toArray();

      const totalPendingAmount = pendingWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
      if (totalPendingAmount + amount > availableBalance) {
        return NextResponse.json(
          {
            error: `Insufficient balance. You have ${totalPendingAmount.toFixed(2)} in pending withdrawals. Available: ${(
              availableBalance - totalPendingAmount
            ).toFixed(2)}`,
          },
          { status: 400 }
        );
      }

      // Check for pending orders (not yet delivered) - don't allow withdrawal if there are pending orders
      const pendingCommissions = await commissionsCol
        .find({
          ...baseQuery,
          affiliateId: String(affiliate._id),
          status: "pending",
        })
        .toArray();

      if (pendingCommissions.length > 0) {
        // Check if any of these orders are not yet delivered
        const pendingOrderIds = pendingCommissions.map((c) => c.orderId).filter(Boolean);
        if (pendingOrderIds.length > 0) {
          const pendingOrders = await ordersCol
            .find({
              ...baseQuery,
              _id: { $in: pendingOrderIds.map((id) => new ObjectId(id)) },
              status: { $ne: "delivered" },
            })
            .toArray();

          if (pendingOrders.length > 0) {
            return NextResponse.json(
              {
                error: `You have ${pendingOrders.length} pending order(s) that are not yet delivered. Please wait until orders are delivered before requesting withdrawal.`,
              },
              { status: 400 }
            );
          }
        }
      }

      const now = new Date().toISOString();
      const withdrawal: Omit<AffiliateWithdrawal, "id"> & { _id?: ObjectId } = {
        affiliateId: String(affiliate._id),
        amount,
        status: "pending",
        paymentMethod: paymentMethod.trim(),
        paymentDetails: {
          accountName: paymentDetails.accountName?.trim(),
          accountNumber: paymentDetails.accountNumber?.trim(),
          bankName: paymentDetails.bankName?.trim(),
          mobileNumber: paymentDetails.mobileNumber?.trim(),
        },
        requestedAt: now,
      };

      if (merchantId) {
        const { isUsingSharedDatabase } = await import("@/lib/api-helpers");
        const useShared = await isUsingSharedDatabase();
        if (useShared) {
          withdrawal.merchantId = merchantId;
        }
      }

      // Deduct amount from available balance immediately (reserve it)
      await affiliatesCol.updateOne(
        { ...baseQuery, _id: affiliate._id },
        {
          $inc: {
            availableBalance: -amount,
          },
          $set: {
            updatedAt: now,
          },
        }
      );

      const result = await withdrawalsCol.insertOne(withdrawal as any);

      return NextResponse.json({
        withdrawal: {
          id: String(result.insertedId),
          ...withdrawal,
        },
      });
    } else if (action === "update" && user.role === "merchant") {
      // Merchant updating withdrawal status
      if (!withdrawalId || !newStatus) {
        return NextResponse.json({ error: "withdrawalId and status are required" }, { status: 400 });
      }

      const withdrawal = await withdrawalsCol.findOne({
        ...baseQuery,
        _id: new ObjectId(withdrawalId),
      });

      if (!withdrawal) {
        return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 });
      }

      const updateData: any = {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };

      if (newStatus === "approved" || newStatus === "completed") {
        updateData.processedAt = new Date().toISOString();
        updateData.processedBy = user.id;

        // If completed, update totalWithdrawn (balance already deducted when created)
        if (newStatus === "completed") {
          await affiliatesCol.updateOne(
            { ...baseQuery, _id: new ObjectId(withdrawal.affiliateId) },
            {
              $inc: {
                totalWithdrawn: withdrawal.amount,
              },
              $set: {
                updatedAt: new Date().toISOString(),
              },
            }
          );
        }
      } else if (newStatus === "cancelled" || newStatus === "rejected") {
        // If cancelled/rejected, return the amount to available balance
        const affiliate = await affiliatesCol.findOne({
          ...baseQuery,
          _id: new ObjectId(withdrawal.affiliateId),
        });

        if (affiliate && withdrawal.status === "pending") {
          // Only refund if it was pending (not already processed)
          await affiliatesCol.updateOne(
            { ...baseQuery, _id: new ObjectId(withdrawal.affiliateId) },
            {
              $inc: {
                availableBalance: withdrawal.amount,
              },
              $set: {
                updatedAt: new Date().toISOString(),
              },
            }
          );
        }
      }

      if (notes) {
        updateData.notes = notes;
      }

      await withdrawalsCol.updateOne({ ...baseQuery, _id: new ObjectId(withdrawalId) }, { $set: updateData });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("POST /api/affiliate/withdrawals error:", error);
    return NextResponse.json({ error: error?.message || "Failed to process withdrawal" }, { status: 500 });
  }
}
