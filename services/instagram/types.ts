export interface InstagramAccount {
  id: string
  username: string
  profilePictureUrl?: string
  followersCount: number
  mediaCount: number
}

export interface InstagramMediaInsights {
  id: string
  impressions: number
  reach: number
  engagement: number
  saved: number
  shares: number
  comments: number
  likes: number
}

export interface InstagramProviderInterface {
  connectAccount(): Promise<{ success: boolean; account?: InstagramAccount; error?: string }>
  publishSingleImage(imageUrl: string, caption: string): Promise<{ success: boolean; mediaId?: string; error?: string }>
  publishCarousel(imageUrls: string[], caption: string): Promise<{ success: boolean; mediaId?: string; error?: string }>
  publishReel(videoUrl: string, caption: string): Promise<{ success: boolean; mediaId?: string; error?: string }>
  getMediaInsights(mediaId: string): Promise<{ success: boolean; insights?: InstagramMediaInsights; error?: string }>
  disconnect(): Promise<void>
}
