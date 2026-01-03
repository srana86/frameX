export interface ISSLCommerzConfig {
  id: string;
  enabled: boolean;
  storeId: string;
  storePassword: string;
  isLive: boolean;
}

export interface ISettings {
  id: string;
  [key: string]: any;
}
