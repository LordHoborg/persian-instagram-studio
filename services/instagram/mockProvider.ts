import { InstagramProviderInterface, InstagramAccount, InstagramMediaInsights } from './types'

export class MockInstagramProvider implements InstagramProviderInterface {
  private connected = false
  private mockAccount: InstagramAccount = {
    id: 'mock-123',
    username: 'your_persian_page',
    followersCount: 15420,
    mediaCount: 342,
  }

  async connectAccount(): Promise<{ success: boolean; account?: InstagramAccount; error?: string }> {
    await new Promise(r => setTimeout(r, 1000))
    this.connected = true
    return { success: true, account: this.mockAccount }
  }

  async publishSingleImage(imageUrl: string, caption: string): Promise<{ success: boolean; mediaId?: string; error?: string }> {
    if (!this.connected) return { success: false, error: 'Instagram متصل نیست' }
    await new Promise(r => setTimeout(r, 1500))
    return { success: true, mediaId: 'media-' + Math.random().toString(36).substr(2, 9) }
  }

  async publishCarousel(imageUrls: string[], caption: string): Promise<{ success: boolean; mediaId?: string; error?: string }> {
    if (!this.connected) return { success: false, error: 'Instagram متصل نیست' }
    await new Promise(r => setTimeout(r, 2000))
    return { success: true, mediaId: 'media-' + Math.random().toString(36).substr(2, 9) }
  }

  async publishReel(videoUrl: string, caption: string): Promise<{ success: boolean; mediaId?: string; error?: string }> {
    if (!this.connected) return { success: false, error: 'Instagram متصل نیست' }
    await new Promise(r => setTimeout(r, 2000))
    return { success: true, mediaId: 'media-' + Math.random().toString(36).substr(2, 9) }
  }

  async getMediaInsights(mediaId: string): Promise<{ success: boolean; insights?: InstagramMediaInsights; error?: string }> {
    if (!this.connected) return { success: false, error: 'Instagram متصل نیست' }
    return {
      success: true,
      insights: {
        id: mediaId,
        impressions: 12400,
        reach: 8900,
        engagement: 1450,
        saved: 567,
        shares: 234,
        comments: 89,
        likes: 1450,
      }
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false
  }
}

export const mockInstagramProvider = new MockInstagramProvider()
