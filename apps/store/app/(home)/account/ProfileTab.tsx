"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, MapPin, Save } from "lucide-react";
import { toast } from "sonner";
import type { CustomerInfo } from "@/lib/types";

interface ProfileTabProps {
  userProfile: CustomerInfo | null;
  onProfileUpdate: (profile: CustomerInfo) => void;
}

export default function ProfileTab({ userProfile, onProfileUpdate }: ProfileTabProps) {
  const [saving, setSaving] = useState(false);

  const form = useForm<CustomerInfo>({
    defaultValues: userProfile || {
      fullName: "",
      email: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      postalCode: "",
      notes: "",
    },
  });

  // Update form when userProfile changes
  useEffect(() => {
    if (userProfile) {
      form.reset(userProfile);
    }
  }, [userProfile, form]);

  const onSubmit = async (values: CustomerInfo) => {
    setSaving(true);
    try {
      onProfileUpdate(values);
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <User className='w-5 h-5' />
          Personal Information
        </CardTitle>
        <CardDescription>Update your personal details and delivery address</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Contact Information */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <User className='w-4 h-4' />
                Contact Information
              </h3>

              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='fullName'
                  rules={{ required: "Full name is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='flex items-center gap-2'>
                        <User className='w-4 h-4' />
                        Full Name *
                      </FormLabel>
                      <FormControl>
                        <Input placeholder='John Doe' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='phone'
                  rules={{
                    required: "Phone is required",
                    pattern: {
                      value: /^[\+]?[1-9][\d]{0,15}$/,
                      message: "Please enter a valid phone number",
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='flex items-center gap-2'>
                        <Phone className='w-4 h-4' />
                        Phone Number *
                      </FormLabel>
                      <FormControl>
                        <Input placeholder='+1 555 000 1234' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='email'
                rules={{
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Please enter a valid email address",
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='flex items-center gap-2'>
                      <Mail className='w-4 h-4' />
                      Email (optional)
                    </FormLabel>
                    <FormControl>
                      <Input type='email' placeholder='you@example.com' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Delivery Address */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <MapPin className='w-4 h-4' />
                Delivery Address
              </h3>

              <FormField
                control={form.control}
                name='addressLine1'
                rules={{ required: "Address is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address *</FormLabel>
                    <FormControl>
                      <Input placeholder='123 Main Street, Apartment 4B' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='addressLine2'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 2 (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder='Apartment, suite, floor, landmark' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='city'
                  rules={{ required: "City is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City *</FormLabel>
                      <FormControl>
                        <Input placeholder='New York' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='postalCode'
                  rules={{ required: "Postal code is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code *</FormLabel>
                      <FormControl>
                        <Input placeholder='10001' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='notes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder='Special delivery instructions, gate codes, etc.' {...field} className='min-h-[80px]' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type='submit' disabled={saving} size='lg' className='w-full sm:w-auto'>
              {saving ? (
                <>
                  <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2' />
                  Saving...
                </>
              ) : (
                <>
                  <Save className='w-4 h-4 mr-2' />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
