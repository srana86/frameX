export interface FBEvent {
  id?: string;
  eventName: string;
  eventId?: string;
  eventData?: {
    content_ids?: string[];
    content_name?: string;
    value?: number;
    currency?: string;
    [key: string]: any;
  };
  userData?: {
    email?: string;
    emails?: string[];
    phone?: string;
    phones?: string[];
    firstName?: string;
    lastName?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  timestamp?: Date;
  createdAt?: Date;
}

export interface MetaPixelEvent {
  eventName: string;
  eventId?: string;
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    zipCode?: string;
    externalId?: string;
  };
  customData?: {
    value?: number;
    currency?: string;
    contentIds?: string[];
    numItems?: number;
    orderId?: string;
  };
  eventSourceUrl?: string;
  actionSource?: string;
  fbp?: string;
  fbc?: string;
  clientIpAddress?: string;
}
