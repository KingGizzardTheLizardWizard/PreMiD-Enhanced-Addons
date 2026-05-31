import { ActivityType } from 'premid'

const presence = new Presence({ clientId: '864304063804997702' })
const browsingTimestamp = Math.floor(Date.now() / 1000)
const ASURA_SCANS_LOGO = 'https://cdn.rcd.gg/PreMiD/websites/A/Asura%20Scans/assets/logo.png'
const CHAPTER_CONTAINER_SELECTORS = [
  'div.py-4.mx-5.md\\:mx-0.flex.flex-col.items-center.justify-center',
  'div.py-8.-mx-5.md\\:mx-0.flex.flex-col.items-center.justify-center',
]

interface Comic {
  title: string
  url: string
  image: string
}

const comic: Comic = {
  title: '',
  url: '',
  image: '',
}

presence.on('UpdateData', async () => {
  const { pathname, href } = window.location
  const presenceData: PresenceData = {
    startTimestamp: browsingTimestamp,
    largeImageKey: ASURA_SCANS_LOGO,
    type: ActivityType.Watching,
  }

  const [
    displayPercentage,
    privacyMode,
    displayChapter,
    displayCover,
    displayButtons,
  ] = await Promise.all([
    presence.getSetting<boolean>('readingPercentage'),
    presence.getSetting<boolean>('privacy'),
    presence.getSetting<boolean>('chapterNumber'),
    presence.getSetting<boolean>('showCover'),
    presence.getSetting<boolean>('showButtons'),
  ])

  if (privacyMode) {
    presenceData.details = 'Browsing Asura Scans'
    presence.setActivity(presenceData)
    return
  }

  // --- HELPER: Get Clean Title from Document Title ---
  const getCleanTitle = () => {
    return document.title.split(' | Asura Scans')[0]?.trim() ?? document.title
  }

  const isOverviewPage = onComicHomePage(pathname)
  
  // Update if new comic, OR if we are on overview and haven't loaded a cover yet
  const needsUpdate = isNewComic(href, comic) || (isOverviewPage && comic.image === ASURA_SCANS_LOGO)

  if (onComicOrChapterPage(pathname) && needsUpdate) {
    const baseUrl = href.split('/chapter')[0]!
    
    comic.url = baseUrl
    
    const rawTitle = document.title
    const siteLessTitle = rawTitle.split(' | Asura Scans')[0]?.trim() ?? rawTitle
    const titleLessChapter = siteLessTitle.split('Chapter')[0]?.trim() ?? siteLessTitle
    
    comic.title = titleLessChapter

    if (displayCover) {
      let fetchedImage: string | undefined = ASURA_SCANS_LOGO

      // STRATEGY CHANGE:
      // If on Overview Page: ALWAYS fetch the meta tag to ensure we get the high-res cover
      if (isOverviewPage) {
         fetchedImage = await getComicImage(comic.url)
      }
      else {
        // If on Chapter Page: Try DOM first, fallback to fetch
        const imgElement = document.querySelector<HTMLImageElement>(
          'img[class*="cover"]',
        )
        if (imgElement) {
          fetchedImage = imgElement.src
        }
        else {
          fetchedImage = await getComicImage(comic.url)
        }
      }
      
      comic.image = fetchedImage ?? ASURA_SCANS_LOGO
    }
    else {
      comic.image = ASURA_SCANS_LOGO
    }
  }

  // --- PAGE HANDLING ---

  // 1. CHAPTER PAGE
  if (onChapterPage(pathname)) {
    const displayTitle = comic.title || (getCleanTitle().split('Chapter')[0]?.trim() ?? 'Unknown Manga')
    
    presenceData.details = `Reading ${displayTitle}`
    presenceData.largeImageKey = comic.image ? comic.image : ASURA_SCANS_LOGO

    if (displayButtons) {
      presenceData.buttons = [
        {
          label: 'View Comic Page',
          url: comic.url || href.split('/chapter')[0]!,
        },
        {
          label: 'View Chapter',
          url: href,
        },
      ]
    }

    if (displayChapter) {
      const progress = displayPercentage ? getChapterProgress() : null
      const chapterNumber = getChapterNumber()

      presenceData.state = `Chapter ${chapterNumber}${progress !== null ? ` - ${progress}%` : ''}`
    }
    else {
      presenceData.state = 'Reading...'
    }
  }
  // 2. COMIC OVERVIEW PAGE
  else if (isOverviewPage) {
    const displayTitle = comic.title || getCleanTitle()

    presenceData.details = `Viewing ${displayTitle}`
    presenceData.state = 'Overview'
    
    presenceData.largeImageKey = comic.image ? comic.image : ASURA_SCANS_LOGO

    if (displayButtons) {
      presenceData.buttons = [
        {
          label: 'View Comic Page',
          url: comic.url || href,
        },
      ]
    }
  }
  // 3. OTHER PAGES
  else if (pathname.startsWith('/bookmark')) {
    presenceData.details = 'Viewing Bookmarks'
  }
  else if (pathname.startsWith('/series')) {
    presenceData.details = 'Viewing Comic List'
  }
  else if (pathname === '/') {
    presenceData.details = 'Viewing Home Page'
  }
  else {
    presenceData.details = 'Browsing Asura Scans'
    presenceData.state = document.title
  }

  if (presenceData.details)
    presence.setActivity(presenceData)
  else
    presence.setActivity()
})

function onComicOrChapterPage(path: string) {
  return /\/(series|comics)\/[a-z0-9-].*$/i.test(path)
}

function onComicHomePage(path: string) {
  return /\/(series|comics)\/[a-z0-9-]+\/?$/i.test(path)
}

function onChapterPage(path: string) {
  return /\/(series|comics)\/[a-z0-9-]+\/chapter\/\d+\/?$/i.test(path)
}

function isNewComic(path: string, comic: Comic) {
  return comic.url !== path.split('/chapter')[0]
}

function getChapterNumber() {
  return document.title.split('Chapter')[1]?.split('-')[0]?.trim() ?? ''
}

function getChapterContainer(): HTMLElement | null {
  for (const selector of CHAPTER_CONTAINER_SELECTORS) {
    const el = document.querySelector<HTMLElement>(selector)
    if (el) {
      return el
    }
  }
  return null
}

function getChapterProgress(): number | null {
  try {
    const container = getChapterContainer()
    if (!container) {
      return null
    }

    const rect = container.getBoundingClientRect()
    const totalHeight = rect.height

    if (!totalHeight || !Number.isFinite(totalHeight)) {
      return null
    }

    const scrollY = window.scrollY || window.pageYOffset
    const containerTop = rect.top + scrollY
    const containerBottom = containerTop + totalHeight
    const viewportBottom = scrollY + window.innerHeight

    const visibleBottom = Math.min(viewportBottom, containerBottom)
    const progress = ((visibleBottom - containerTop) / totalHeight) * 100

    const clamped = Math.max(0, Math.min(100, progress))
    return Number.isFinite(clamped) ? Number(clamped.toFixed(1)) : null
  }
  catch {
    return null
  }
}

async function getComicImage(comicHomePageURL: string): Promise<string | undefined> {
  try {
    const res = await (await fetch(comicHomePageURL)).text()
    return new DOMParser()
      .parseFromString(res, 'text/html')
      ?.querySelector<HTMLMetaElement>('head > meta[property="og:image"]')
      ?.content
  }
  catch {
    return undefined
  }
}