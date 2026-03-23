export type OmiseCharge = {
  id: string;
  status: string;
  authorize_uri?: string;
  source?: {
    scannable_code?: {
      image?: {
        download_uri?: string;
      };
    };
  };
};
