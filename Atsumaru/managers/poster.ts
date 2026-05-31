export class PosterManager {
  private savedPosterUrl: string | null = null

  updatePoster(): void {
    const pathname = document.location.pathname

    if (pathname.includes('/manga/')) {
      // We are on the info page, so we can find the poster image here
      this.checkAndSavePoster()
    }
    else if (pathname.includes('/read/')) {
      // We are on the reading page. 
      // We DO NOT reset the poster here, so it keeps the image from the info page.
      // (If you want to try and find a specific reading-page poster, you can add logic here)
    }
    else {
      // We are on Home, Search, etc. Reset the poster.
      this.resetPoster()
    }
  }

  private checkAndSavePoster(): void {
    const posterSelector = 'article img.poster'
    const posterElement = document.querySelector<HTMLImageElement>(posterSelector)
    
    if (!posterElement || !posterElement.src)
      return

    // Only update if we found a valid image
    this.savedPosterUrl = posterElement.src
  }

  private resetPoster(): void {
    this.savedPosterUrl = null
  }

  get posterUrl(): string | null {
    return this.savedPosterUrl
  }
}