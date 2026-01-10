"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User, LogOut, Mail, Phone, MapPin, Package, ShoppingBag, LayoutDashboard, ArrowRight, Edit, Save, X, Gift } from "lucide-react";
import type { CustomerInfo } from "@/lib/types";
import { toast } from "sonner";
import { useCurrencySymbol } from "@/hooks/use-currency";
import { apiRequest } from "@/lib/api-client";

function AffiliateCard() {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAffiliateEnabled = async () => {
      try {
        const data = await apiRequest<any>("GET", "/affiliate/me");
        setEnabled(data.enabled !== false);
      } catch {
        setEnabled(false);
      }
    };
    checkAffiliateEnabled();
  }, []);

  if (enabled === false) {
    return null;
  }

  return (
    <Card className='hover:shadow-lg transition-shadow cursor-pointer group'>
      <Link href='/account/affiliate'>
        <CardContent className='p-6'>
          <div className='flex items-center gap-4'>
            <div className='p-3 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors'>
              <Gift className='w-6 h-6 text-green-600' />
            </div>
            <div className='flex-1'>
              <h3 className='font-semibold'>Affiliate Program</h3>
              <p className='text-sm text-muted-foreground'>Earn commissions</p>
            </div>
            <ArrowRight className='w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors' />
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}

export default function AccountPage() {
  const currencySymbol = useCurrencySymbol();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<CustomerInfo>({
    fullName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postalCode: "",
    notes: "",
  });
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await apiRequest<any>("GET", "/auth/me");

        if (data.data) {
          const userData = data.data;
          setUserProfile(userData);
          setUserRole(userData.role || null);
          setFormData({
            fullName: userData.fullName || "",
            email: userData.email || "",
            phone: userData.phone || "",
            addressLine1: userData.addressLine1 || "",
            addressLine2: userData.addressLine2 || "",
            city: userData.city || "",
            postalCode: userData.postalCode || "",
            notes: userData.notes || "",
          });
          localStorage.setItem("shoestore_user_profile", JSON.stringify(userData));
        }
      } catch (error: any) {
        console.error("Error fetching user:", error);
        if (error?.response?.status === 401) {
          router.push("/login");
          return;
        }
        toast.error("Failed to load user data");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleSave = async () => {
    try {
      const data = await apiRequest<any>("PUT", "/auth/update-profile", formData);
      const userData = data.data;
      setUserProfile(userData);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
      localStorage.setItem("shoestore_user_profile", JSON.stringify(userData));
    } catch (error: any) {
      toast.error(error?.message || "Failed to update profile");
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest<any>("POST", "/auth/logout");
      if (typeof window !== "undefined") {
        localStorage.removeItem("shoestore_user_profile");
        localStorage.removeItem("auth_token");
      }
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-background to-accent/5 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
          <p className='mt-4 text-muted-foreground'>Loading...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return null;
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-background to-accent/5'>
      <div className='mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl sm:text-4xl font-bold tracking-tight flex items-center gap-3'>
            <User className='w-8 h-8 sm:w-10 sm:h-10 text-primary' />
            My Account
          </h1>
          <p className='text-muted-foreground mt-2'>Manage your profile and account settings</p>
        </div>

        <div className='grid gap-6 lg:grid-cols-3'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Quick Actions */}
            <div className='grid gap-4 sm:grid-cols-2'>
              {userRole === "merchant" && (
                <Card className='hover:shadow-lg transition-shadow cursor-pointer group'>
                  <Link href='/merchant'>
                    <CardContent className='p-6'>
                      <div className='flex items-center gap-4'>
                        <div className='p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors'>
                          <LayoutDashboard className='w-6 h-6 text-primary' />
                        </div>
                        <div className='flex-1'>
                          <h3 className='font-semibold'>Dashboard</h3>
                          <p className='text-sm text-muted-foreground'>Manage your store</p>
                        </div>
                        <ArrowRight className='w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors' />
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              )}
              <Card className='hover:shadow-lg transition-shadow cursor-pointer group'>
                <Link href='/account/orders'>
                  <CardContent className='p-6'>
                    <div className='flex items-center gap-4'>
                      <div className='p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors'>
                        <Package className='w-6 h-6 text-primary' />
                      </div>
                      <div className='flex-1'>
                        <h3 className='font-semibold'>My Orders</h3>
                        <p className='text-sm text-muted-foreground'>View order history</p>
                      </div>
                      <ArrowRight className='w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors' />
                    </div>
                  </CardContent>
                </Link>
              </Card>
              <AffiliateCard />
            </div>

            {/* Profile Information */}
            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div>
                    <CardTitle className='flex items-center gap-2'>
                      <User className='w-5 h-5' />
                      Profile Information
                    </CardTitle>
                    <CardDescription>Update your personal information</CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button variant='outline' size='sm' onClick={() => setIsEditing(true)}>
                      <Edit className='w-4 h-4 mr-2' />
                      Edit
                    </Button>
                  ) : (
                    <div className='flex gap-2'>
                      <Button variant='outline' size='sm' onClick={() => setIsEditing(false)}>
                        <X className='w-4 h-4 mr-2' />
                        Cancel
                      </Button>
                      <Button size='sm' onClick={handleSave}>
                        <Save className='w-4 h-4 mr-2' />
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='fullName' className='flex items-center gap-2'>
                      <User className='w-4 h-4' />
                      Full Name
                    </Label>
                    {isEditing ? (
                      <Input
                        id='fullName'
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder='John Doe'
                      />
                    ) : (
                      <p className='text-sm font-medium'>{userProfile.fullName || "Not set"}</p>
                    )}
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='phone' className='flex items-center gap-2'>
                      <Phone className='w-4 h-4' />
                      Phone Number
                    </Label>
                    {isEditing ? (
                      <Input
                        id='phone'
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder='+1 555 000 1234'
                      />
                    ) : (
                      <p className='text-sm font-medium'>{userProfile.phone || "Not set"}</p>
                    )}
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='email' className='flex items-center gap-2'>
                    <Mail className='w-4 h-4' />
                    Email Address
                  </Label>
                  {isEditing ? (
                    <Input
                      id='email'
                      type='email'
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder='you@example.com'
                    />
                  ) : (
                    <p className='text-sm font-medium'>{userProfile.email || "Not set"}</p>
                  )}
                </div>

                <Separator />

                <div className='space-y-4'>
                  <h3 className='font-semibold flex items-center gap-2'>
                    <MapPin className='w-4 h-4' />
                    Delivery Address
                  </h3>
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <div className='space-y-2 sm:col-span-2'>
                      <Label htmlFor='addressLine1'>Street Address</Label>
                      {isEditing ? (
                        <Input
                          id='addressLine1'
                          value={formData.addressLine1}
                          onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                          placeholder='123 Main Street'
                        />
                      ) : (
                        <p className='text-sm font-medium'>{userProfile.addressLine1 || "Not set"}</p>
                      )}
                    </div>
                    <div className='space-y-2 sm:col-span-2'>
                      <Label htmlFor='addressLine2'>Address Line 2 (Optional)</Label>
                      {isEditing ? (
                        <Input
                          id='addressLine2'
                          value={formData.addressLine2}
                          onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                          placeholder='Apartment, suite, floor'
                        />
                      ) : (
                        <p className='text-sm font-medium'>{userProfile.addressLine2 || "Not set"}</p>
                      )}
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='city'>City</Label>
                      {isEditing ? (
                        <Input
                          id='city'
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder='New York'
                        />
                      ) : (
                        <p className='text-sm font-medium'>{userProfile.city || "Not set"}</p>
                      )}
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='postalCode'>Postal Code</Label>
                      {isEditing ? (
                        <Input
                          id='postalCode'
                          value={formData.postalCode}
                          onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                          placeholder='10001'
                        />
                      ) : (
                        <p className='text-sm font-medium'>{userProfile.postalCode || "Not set"}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className='space-y-2'>
                  <Label htmlFor='notes'>Delivery Notes (Optional)</Label>
                  {isEditing ? (
                    <Textarea
                      id='notes'
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder='Special delivery instructions...'
                      className='min-h-20'
                    />
                  ) : (
                    <p className='text-sm font-medium'>{userProfile.notes || "No notes"}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Account Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Account Summary</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>Role</span>
                  <Badge variant='secondary' className='capitalize'>
                    {userRole || "Customer"}
                  </Badge>
                </div>
                <Separator />
                <div className='space-y-2'>
                  <Button variant='outline' className='w-full justify-start' asChild>
                    <Link href='/account/orders'>
                      <Package className='w-4 h-4 mr-2' />
                      View Orders
                    </Link>
                  </Button>
                  {userRole === "merchant" && (
                    <Button variant='outline' className='w-full justify-start' asChild>
                      <Link href='/merchant'>
                        <LayoutDashboard className='w-4 h-4 mr-2' />
                        Go to Dashboard
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant='destructive' className='w-full' onClick={handleLogout}>
                  <LogOut className='w-4 h-4 mr-2' />
                  Logout
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
