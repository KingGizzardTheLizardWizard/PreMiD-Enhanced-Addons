import type { Settings } from '../types.js'
import { Assets } from 'premid'

export class RouteHandlers {
  public static handleSearchPage(
    presenceData: PresenceData,
    search: string,
  ): void {
    const queryParams = new URLSearchParams(search)
    const searchQuery = queryParams.get('query')

    if (searchQuery) {
      const decodedQuery = searchQuery.replace(/\+/g, ' ')

      presenceData.smallImageKey = Assets.Search
      presenceData.smallImageText = 'Searching'
      presenceData.details = `Searching for '${decodedQuery}'`
    }
    else {
      this.handleDefaultPage(presenceData)
    }
  }

  public static handleMangaPage(
    presenceData: PresenceData,
    settings: Settings,

  ): void {
    const titleElement = document.querySelector('html > head > title')
    const rawTitle = titleElement?.textContent?.trim() || 'Loading'
    const cleanTitle = rawTitle.split(' - ')[0]

    presenceData.details = `Viewing ${cleanTitle}`
    presenceData.state = 'Overview'

    if (settings?.showButtons) {
      presenceData.buttons = [
        {
          label: 'View Manga',
          url: document.location.href,
        },
      ]
    }
  }

  public static handleMangaReadPage(
    presenceData: PresenceData,
    settings: Settings,
  ): void {
    const titleElement = document.querySelector('html > head > title')
    const rawTitle = titleElement?.textContent?.trim() || 'Loading...'

    const delimiter = ' - Chapter '

    if (rawTitle.includes(delimiter)) {
      const [mangaName, chapterNumber] = rawTitle.split(delimiter)

      presenceData.details = mangaName
      presenceData.state = `Chapter ${chapterNumber}`

      if (settings?.showButtons) {
        presenceData.buttons = [
          {
            label: `View Chapter ${chapterNumber}`,
            url: document.location.href,
          },
        ]
      }
    }
    else {
      presenceData.details = rawTitle
      presenceData.state = 'Reading...'
    }
  }
  
  public static handleBrowsePage(
    presenceData: PresenceData,
    settings: Settings,

    pathname: string,
  ): void {
    const parts = pathname.split('/').filter(part => part !== '')

    if (parts.length >= 2) {
      const genreSlug = parts[1]

      if (genreSlug) {
        const formattedGenre = genreSlug
          .replace(/-/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase())

        presenceData.details = formattedGenre
        presenceData.state = `Browsing the category`
      }
      else {
        presenceData.details = 'Browse categories'
      }
      if (settings?.showButtons) {
        presenceData.buttons = [
          {
          label: 'View Category',
          url: document.location.href,
        },
        ]
      }
    }
  }

  public static handleHomePage(presenceData: PresenceData): void {
    presenceData.details = 'On the homepage'
  }

  public static handleLeaderboardPage(presenceData: PresenceData): void {
    presenceData.details = 'Displaying the Leaderboard'
  }

  public static handleDefaultPage(presenceData: PresenceData): void {
    presenceData.details = 'Page Displaying...'
  }
}
