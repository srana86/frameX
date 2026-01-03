"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Rocket, CreditCard, Database, ArrowRight } from "lucide-react";

interface Stats {
  merchants: number;
  deployments: number;
  subscriptions: number;
  databases: number;
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats>({
    merchants: 0,
    deployments: 0,
    subscriptions: 0,
    databases: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [merchantsRes, deploymentsRes, subscriptionsRes, databasesRes] = await Promise.all([
          fetch("/api/merchants").catch(() => null),
          fetch("/api/deployments").catch(() => null),
          fetch("/api/subscriptions").catch(() => null),
          fetch("/api/databases").catch(() => null),
        ]);

        const merchants = merchantsRes?.ok ? await merchantsRes.json() : [];
        const deployments = deploymentsRes?.ok ? await deploymentsRes.json() : [];
        const subscriptions = subscriptionsRes?.ok ? await subscriptionsRes.json() : [];
        const databases = databasesRes?.ok ? await databasesRes.json() : [];

        setStats({
          merchants: merchants.length || 0,
          deployments: deployments.length || 0,
          subscriptions: subscriptions.length || 0,
          databases: databases.length || 0,
        });
      } catch (error) {
        console.error("Failed to load stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div className='min-h-screen bg-linear-to-br from-background to-accent/5'>
      <div className='container mx-auto px-4 py-16'>
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold tracking-tight mb-4'>Super Admin Panel</h1>
          <p className='text-xl text-muted-foreground'>Manage all merchants, deployments, and subscriptions</p>
        </div>

        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto mb-12'>
          <Card className='hover:shadow-lg transition-shadow'>
            <CardHeader>
              <Users className='h-8 w-8 text-primary mb-2' />
              <CardTitle>Merchants</CardTitle>
              <CardDescription>Total merchant accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold'>{loading ? "..." : stats.merchants}</div>
              <Button asChild variant='link' className='p-0 mt-2'>
                <Link href='/merchants'>
                  View All <ArrowRight className='ml-1 h-4 w-4' />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className='hover:shadow-lg transition-shadow'>
            <CardHeader>
              <Rocket className='h-8 w-8 text-primary mb-2' />
              <CardTitle>Deployments</CardTitle>
              <CardDescription>Active deployments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold'>{loading ? "..." : stats.deployments}</div>
              <Button asChild variant='link' className='p-0 mt-2'>
                <Link href='/deployments'>
                  View All <ArrowRight className='ml-1 h-4 w-4' />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className='hover:shadow-lg transition-shadow'>
            <CardHeader>
              <CreditCard className='h-8 w-8 text-primary mb-2' />
              <CardTitle>Subscriptions</CardTitle>
              <CardDescription>Active subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold'>{loading ? "..." : stats.subscriptions}</div>
              <Button asChild variant='link' className='p-0 mt-2'>
                <Link href='/subscriptions'>
                  View All <ArrowRight className='ml-1 h-4 w-4' />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className='hover:shadow-lg transition-shadow'>
            <CardHeader>
              <Database className='h-8 w-8 text-primary mb-2' />
              <CardTitle>Databases</CardTitle>
              <CardDescription>Merchant databases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold'>{loading ? "..." : stats.databases}</div>
              <Button asChild variant='link' className='p-0 mt-2'>
                <Link href='/database'>
                  View All <ArrowRight className='ml-1 h-4 w-4' />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className='max-w-4xl mx-auto'>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className='grid gap-4 md:grid-cols-2'>
              <Button asChild variant='outline' className='h-auto py-4 justify-start'>
                <Link href='/merchants'>
                  <Users className='mr-2 h-5 w-5' />
                  <div className='text-left'>
                    <div className='font-semibold'>Manage Merchants</div>
                    <div className='text-sm text-muted-foreground'>View and create merchant accounts</div>
                  </div>
                </Link>
              </Button>

              <Button asChild variant='outline' className='h-auto py-4 justify-start'>
                <Link href='/deployments'>
                  <Rocket className='mr-2 h-5 w-5' />
                  <div className='text-left'>
                    <div className='font-semibold'>View Deployments</div>
                    <div className='text-sm text-muted-foreground'>Monitor all deployments</div>
                  </div>
                </Link>
              </Button>

              <Button asChild variant='outline' className='h-auto py-4 justify-start'>
                <Link href='/subscriptions'>
                  <CreditCard className='mr-2 h-5 w-5' />
                  <div className='text-left'>
                    <div className='font-semibold'>Subscriptions</div>
                    <div className='text-sm text-muted-foreground'>Manage subscriptions and plans</div>
                  </div>
                </Link>
              </Button>

              <Button asChild variant='outline' className='h-auto py-4 justify-start'>
                <Link href='/plans'>
                  <CreditCard className='mr-2 h-5 w-5' />
                  <div className='text-left'>
                    <div className='font-semibold'>Plans</div>
                    <div className='text-sm text-muted-foreground'>Manage subscription plans</div>
                  </div>
                </Link>
              </Button>

              <Button asChild variant='outline' className='h-auto py-4 justify-start'>
                <Link href='/database'>
                  <Database className='mr-2 h-5 w-5' />
                  <div className='text-left'>
                    <div className='font-semibold'>Database Management</div>
                    <div className='text-sm text-muted-foreground'>View all merchant databases</div>
                  </div>
                </Link>
              </Button>

              <Button asChild variant='outline' className='h-auto py-4 justify-start border-primary'>
                <Link href='/simulate'>
                  <Rocket className='mr-2 h-5 w-5' />
                  <div className='text-left'>
                    <div className='font-semibold'>Flow Simulation</div>
                    <div className='text-sm text-muted-foreground'>Test subscription to deployment flow</div>
                  </div>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
