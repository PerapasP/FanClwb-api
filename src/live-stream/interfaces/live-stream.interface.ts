export interface StreamResponse {
  stream_id: string;
  fandom_id: string;
  host_user_id: string;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  stream_key?: string;
  rtmp_url?: string | null;
  hls_url?: string | null;
  status: string;
  viewer_count: number;
  peak_viewer_count: number;
  total_gifts_coins: number;
  scheduled_at?: Date | null;
  started_at?: Date | null;
  ended_at?: Date | null;
  created_at: Date;
}

export interface StreamMessageResponse {
  message_id: string;
  stream_id: string;
  user_id: string;
  content: string;
  created_at: Date;
  user: {
    user_id: string;
    fullname: string | null;
  };
}

export interface StreamGiftResponse {
  gift_id: string;
  stream_id: string;
  sender_id: string;
  quantity: number;
  total_coins: number;
  created_at: Date;
  sender: {
    user_id: string;
    fullname: string | null;
  };
  gift_type: {
    id: string;
    name: string;
    display_name: string;
    icon_url: string | null;
    coin_value: number;
  };
}

export interface GiftLeaderboardEntry {
  sender_id: string;
  fullname: string | null;
  total_coins: number;
  gift_count: number;
}

export interface WsMessagePayload {
  streamId: string;
  message: StreamMessageResponse;
}

export interface WsGiftPayload {
  streamId: string;
  gift: StreamGiftResponse;
}

export interface WsViewerCountPayload {
  streamId: string;
  count: number;
}

export interface WsStreamStatusPayload {
  streamId: string;
  status: string;
  hls_url?: string | null;
}
