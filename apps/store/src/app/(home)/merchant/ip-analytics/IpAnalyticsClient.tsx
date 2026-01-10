"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Globe,
  MapPin,
  ShoppingBag,
  Eye,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api-client";

interface IpStat {
  ip: string;
  visitCount: number;
  orderCount: number;
  geolocation?: {
    ip: string;
    country?: string;
    countryCode?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    isp?: string;
    capturedAt: string;
  };
  paths: string[];
  firstVisit: string;
  lastVisit: string;
}

export function IpAnalyticsClient() {
  const [data, setData] = useState<IpStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await apiRequest<any>("GET", "/visits?limit=1000");
      if (result.success) {
        setData(result.data || []);
      } else {
        throw new Error(result.error || "Failed to fetch data");
      }
    } catch (error: any) {
      console.error("Error fetching IP analytics:", error);
      toast.error(error.message || "Failed to load IP analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const query = searchQuery.toLowerCase();
    return data.filter(
      (item) =>
        item.ip.toLowerCase().includes(query) ||
        item.geolocation?.country?.toLowerCase().includes(query) ||
        item.geolocation?.city?.toLowerCase().includes(query) ||
        item.geolocation?.region?.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  const stats = useMemo(() => {
    const totalIPs = data.length;
    const totalVisits = data.reduce((sum, item) => sum + item.visitCount, 0);
    const totalOrders = data.reduce((sum, item) => sum + item.orderCount, 0);
    const ipsWithOrders = data.filter((item) => item.orderCount > 0).length;
    const uniqueCountries = new Set(data.map((item) => item.geolocation?.countryCode).filter(Boolean)).size;

    return {
      totalIPs,
      totalVisits,
      totalOrders,
      ipsWithOrders,
      uniqueCountries,
      conversionRate: totalVisits > 0 ? ((ipsWithOrders / totalIPs) * 100).toFixed(1) : "0",
    };
  }, [data]);

  const mapData = useMemo(() => {
    return filteredData
      .filter((item) => item.geolocation?.latitude && item.geolocation?.longitude)
      .map((item) => ({
        ...item,
        lat: item.geolocation!.latitude!,
        lng: item.geolocation!.longitude!,
      }));
  }, [filteredData]);

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Spinner className='w-8 h-8' />
      </div>
    );
  }

  return (
    <div className='space-y-6 p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>IP Analytics</h1>
          <p className='text-muted-foreground mt-1'>Track IP addresses, geolocation, and order patterns</p>
        </div>
        <Button onClick={fetchData} variant='outline' size='sm'>
          <RefreshCw className='w-4 h-4 mr-2' />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Total IPs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.totalIPs}</div>
            <p className='text-xs text-muted-foreground mt-1'>Unique IP addresses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Total Visits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.totalVisits}</div>
            <p className='text-xs text-muted-foreground mt-1'>Page visits tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.totalOrders}</div>
            <p className='text-xs text-muted-foreground mt-1'>Orders from tracked IPs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>IPs with Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.ipsWithOrders}</div>
            <p className='text-xs text-muted-foreground mt-1'>{stats.conversionRate}% conversion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Countries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.uniqueCountries}</div>
            <p className='text-xs text-muted-foreground mt-1'>Unique countries</p>
          </CardContent>
        </Card>
      </div>

      {/* Map Visualization */}
      {mapData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <MapPin className='w-5 h-5' />
              Geographic Distribution
            </CardTitle>
            <CardDescription>
              {mapData.length} IP addresses with location data. Click on IPs in the table to view on map.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='w-full h-[400px] rounded-lg overflow-hidden border bg-muted/20 flex items-center justify-center'>
              <div className='text-center space-y-4 p-8'>
                <MapPin className='w-16 h-16 mx-auto text-muted-foreground' />
                <div>
                  <h3 className='font-semibold text-lg mb-2'>Geographic Distribution</h3>
                  <p className='text-sm text-muted-foreground mb-4'>
                    {mapData.length} IP addresses have location coordinates
                  </p>
                  <div className='flex flex-wrap gap-2 justify-center'>
                    {Array.from(new Set(mapData.map((d) => d.geolocation?.country).filter(Boolean))).slice(0, 10).map((country) => (
                      <Badge key={country} variant='outline'>
                        {country}
                      </Badge>
                    ))}
                  </div>
                  <p className='text-xs text-muted-foreground mt-4'>
                    Click on any IP address in the table below to view its location details
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>IP Addresses</CardTitle>
              <CardDescription>View all tracked IP addresses with geolocation and order data</CardDescription>
            </div>
            <div className='relative w-64'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
              <Input
                placeholder='Search by IP, country, city...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Visits</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>First Visit</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className='text-center py-8 text-muted-foreground'>
                      {searchQuery ? "No IPs found matching your search" : "No IP data available"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => (
                    <TableRow key={item.ip}>
                      <TableCell className='font-mono text-sm'>{item.ip}</TableCell>
                      <TableCell>
                        <div className='space-y-1'>
                          {item.geolocation?.country && (
                            <div className='flex items-center gap-2'>
                              <Globe className='w-3 h-3 text-muted-foreground' />
                              <span className='font-medium'>{item.geolocation.country}</span>
                              {item.geolocation.countryCode && (
                                <Badge variant='outline' className='text-xs'>
                                  {item.geolocation.countryCode}
                                </Badge>
                              )}
                            </div>
                          )}
                          {item.geolocation?.city && (
                            <div className='text-sm text-muted-foreground ml-5'>
                              {item.geolocation.city}
                              {item.geolocation.region && `, ${item.geolocation.region}`}
                            </div>
                          )}
                          {item.geolocation?.latitude && item.geolocation?.longitude && (
                            <a
                              href={`https://www.google.com/maps?q=${item.geolocation.latitude},${item.geolocation.longitude}`}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-xs text-blue-600 hover:underline ml-5 flex items-center gap-1'
                            >
                              <MapPin className='w-3 h-3' />
                              View on Map
                            </a>
                          )}
                          {!item.geolocation && <span className='text-muted-foreground text-sm'>Unknown</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <Eye className='w-4 h-4 text-muted-foreground' />
                          <span className='font-medium'>{item.visitCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.orderCount > 0 ? (
                          <div className='flex items-center gap-2'>
                            <ShoppingBag className='w-4 h-4 text-green-600' />
                            <span className='font-medium text-green-600'>{item.orderCount}</span>
                          </div>
                        ) : (
                          <span className='text-muted-foreground'>0</span>
                        )}
                      </TableCell>
                      <TableCell className='text-sm text-muted-foreground'>
                        {new Date(item.firstVisit).toLocaleDateString()}
                      </TableCell>
                      <TableCell className='text-sm text-muted-foreground'>
                        {new Date(item.lastVisit).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {item.orderCount > 0 ? (
                          <Badge variant='default' className='bg-green-600'>
                            Customer
                          </Badge>
                        ) : (
                          <Badge variant='secondary'>Visitor</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

