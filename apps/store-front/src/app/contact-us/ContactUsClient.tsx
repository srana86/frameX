"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteBreadcrumb } from "@/components/site/Breadcrumb";
import type { BrandConfig } from "@/lib/brand-config";
import { toast } from "sonner";

interface ContactUsClientProps {
  brandConfig: BrandConfig;
}

export function ContactUsClient({ brandConfig }: ContactUsClientProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      toast.success("Thank you for contacting us! We'll get back to you soon.");
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      setIsSubmitting(false);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const breadcrumbItems = [{ label: "Home", href: "/" }, { label: "Contact Us" }];

  return (
    <div className='bg-linear-to-b from-[#f7fbff] via-background to-[#eef4ff] min-h-screen'>
      <div className='mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8'>
        {/* Breadcrumb */}
        <div className='mb-6'>
          <SiteBreadcrumb items={breadcrumbItems} />
        </div>

        {/* Header */}
        <div className='text-center mb-12'>
          <h1 className='text-3xl sm:text-4xl font-bold text-foreground mb-4'>Contact Us</h1>
          <p className='text-muted-foreground text-lg max-w-2xl mx-auto'>
            Have a question or need help? We're here to assist you. Get in touch with us and we'll respond as soon as possible.
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Contact Information Cards */}
          <div className='lg:col-span-1 space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Mail className='h-5 w-5 text-primary' />
                  Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground mb-2'>Send us an email</p>
                <a
                  href={`mailto:${brandConfig.contact?.email || "support@example.com"}`}
                  className='text-primary hover:underline font-medium'
                >
                  {brandConfig.contact?.email || "support@example.com"}
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Phone className='h-5 w-5 text-primary' />
                  Phone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground mb-2'>Call us</p>
                <a href={`tel:${brandConfig.contact?.phone || "+1234567890"}`} className='text-primary hover:underline font-medium'>
                  {brandConfig.contact?.phone || "+1 (234) 567-890"}
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <MapPin className='h-5 w-5 text-primary' />
                  Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground mb-2'>Visit us</p>
                <p className='text-foreground font-medium'>{brandConfig.contact?.address || "123 Business Street, City, State 12345"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Clock className='h-5 w-5 text-primary' />
                  Business Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-1 text-sm'>
                  <p className='text-foreground font-medium'>Monday - Friday</p>
                  <p className='text-muted-foreground'>9:00 AM - 6:00 PM</p>
                  <p className='text-foreground font-medium mt-2'>Saturday</p>
                  <p className='text-muted-foreground'>10:00 AM - 4:00 PM</p>
                  <p className='text-foreground font-medium mt-2'>Sunday</p>
                  <p className='text-muted-foreground'>Closed</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className='lg:col-span-2'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <MessageSquare className='h-5 w-5 text-primary' />
                  Send us a Message
                </CardTitle>
                <CardDescription>Fill out the form below and we'll get back to you as soon as possible.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className='space-y-6'>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='name'>Name *</Label>
                      <Input
                        id='name'
                        name='name'
                        type='text'
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder='Your full name'
                        className='h-10'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='email'>Email *</Label>
                      <Input
                        id='email'
                        name='email'
                        type='email'
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder='your.email@example.com'
                        className='h-10'
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='phone'>Phone</Label>
                    <Input
                      id='phone'
                      name='phone'
                      type='tel'
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder='+1 (234) 567-890'
                      className='h-10'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='subject'>Subject *</Label>
                    <Input
                      id='subject'
                      name='subject'
                      type='text'
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder='What is this regarding?'
                      className='h-10'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='message'>Message *</Label>
                    <Textarea
                      id='message'
                      name='message'
                      required
                      value={formData.message}
                      onChange={handleChange}
                      placeholder='Tell us more about your inquiry...'
                      rows={6}
                      className='resize-none'
                    />
                  </div>

                  <Button type='submit' disabled={isSubmitting} className='w-full h-11 text-base font-semibold'>
                    {isSubmitting ? (
                      <>
                        <Send className='mr-2 h-4 w-4 animate-pulse' />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className='mr-2 h-4 w-4' />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
