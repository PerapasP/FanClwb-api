export type OmiseCharge = {
  id: string;
  status: string;
  authorize_uri?: string;
  metadata?: {
    order_id?: string;
  };
  source?: {
    scannable_code?: {
      image?: {
        download_uri?: string;
      };
    };
  };
};
