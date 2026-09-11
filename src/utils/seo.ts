export interface SeoMetaProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  noindex?: boolean;
  schema?: Record<string, any> | Array<Record<string, any>>;
}

export const BASE_URL = 'https://wikiphysics0.vercel.app';
export const DEFAULT_TITLE = 'منصة ويكيفزياء - أستاذ أحمد صلاح | مدرس الفيزياء للثانوية العامة';
export const DEFAULT_DESC = 'منصة ويكيفزياء التعليمية مع الأستاذ أحمد صلاح، مدرس مادة الفيزياء للثانوية العامة. شروحات بسيطة، أسئلة بنكية متدرجة، امتحانات تفاعلية فورية ومذكرات شاملة للمتفوقين.';

/**
 * Updates dynamic meta tags and structured data for SPA navigation.
 */
export function updatePageSEO(props: SeoMetaProps): void {
  if (typeof document === 'undefined') return;

  const title = props.title || DEFAULT_TITLE;
  const description = props.description || DEFAULT_DESC;
  const canonical = props.canonical || BASE_URL;

  // 1. Update Title
  document.title = title;

  // 2. Helper to set or create meta elements
  const setMeta = (name: string, content: string, isProperty = false) => {
    const attr = isProperty ? 'property' : 'name';
    let el = document.querySelector(`meta[${attr}="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  setMeta('description', description);
  setMeta('og:title', title, true);
  setMeta('og:description', description, true);
  setMeta('og:url', canonical, true);
  setMeta('twitter:title', title);
  setMeta('twitter:description', description);
  setMeta('twitter:url', canonical);

  if (props.ogType) {
    setMeta('og:type', props.ogType, true);
  }
  if (props.ogImage) {
    setMeta('og:image', props.ogImage, true);
    setMeta('twitter:image', props.ogImage);
  }

  // 3. Robots meta handling
  if (props.noindex) {
    setMeta('robots', 'noindex, nofollow');
  } else {
    setMeta('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  }

  // 4. Canonical link tag
  let linkCanonical = document.querySelector('link[rel="canonical"]');
  if (!linkCanonical) {
    linkCanonical = document.createElement('link');
    linkCanonical.setAttribute('rel', 'canonical');
    document.head.appendChild(linkCanonical);
  }
  linkCanonical.setAttribute('href', canonical);

  // 5. Dynamic JSON-LD Schema
  const schemaId = 'dynamic-page-schema';
  let schemaScript = document.getElementById(schemaId);
  if (props.schema) {
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = schemaId;
      schemaScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(schemaScript);
    }
    schemaScript.textContent = JSON.stringify(props.schema);
  } else if (schemaScript) {
    schemaScript.remove();
  }
}

/**
 * Parses browser pathname into internal SPA route and parameters.
 */
export function parsePathToRoute(pathname: string): { view: string; params: Record<string, any> } {
  const clean = pathname.replace(/^\/+|\/+$/g, '');
  if (!clean) return { view: 'home', params: {} };

  const segments = clean.split('/');

  if (segments[0] === 'courses') {
    if (segments.length === 1) {
      return { view: 'courses-catalog', params: {} };
    }
    // Pattern: /courses/:courseId/lessons/:lessonId
    if (segments.length >= 4 && segments[2] === 'lessons' && segments[3]) {
      return { view: 'lesson-player', params: { courseId: segments[1], lessonId: segments[3] } };
    }
    // Pattern: /courses/:courseId
    if (segments.length >= 2 && segments[1]) {
      return { view: 'course-details', params: { courseId: segments[1] } };
    }
  }

  if (segments[0] === 'pdf-library') return { view: 'pdf-library', params: {} };
  if (segments[0] === 'physics-lab') return { view: 'physics-lab', params: {} };
  if (segments[0] === 'dashboard') return { view: 'dashboard', params: {} };
  if (segments[0] === 'my-courses') return { view: 'my-courses', params: {} };
  if (segments[0] === 'flashcards') return { view: 'flashcards', params: {} };
  if (segments[0] === 'leaderboard') return { view: 'leaderboard', params: {} };
  if (segments[0] === 'ai-assistant') return { view: 'ai-assistant', params: {} };
  if (segments[0] === 'my-results') return { view: 'my-results', params: {} };
  if (segments[0] === 'weakness-profile') return { view: 'weakness-profile', params: {} };

  return { view: 'home', params: {} };
}

/**
 * Resolves an internal SPA view and its params into a real, canonical browser path.
 */
export function getRoutePath(view: string, params: Record<string, any> = {}): string {
  switch (view) {
    case 'home':
      return '/';
    case 'courses-catalog':
      return '/courses';
    case 'course-details':
      return params.courseId ? `/courses/${params.courseId}` : '/courses';
    case 'lesson-player':
      return (params.courseId && params.lessonId)
        ? `/courses/${params.courseId}/lessons/${params.lessonId}`
        : (params.courseId ? `/courses/${params.courseId}` : '/courses');
    case 'pdf-library':
      return '/pdf-library';
    case 'physics-lab':
      return '/physics-lab';
    case 'dashboard':
      return '/dashboard';
    case 'my-courses':
      return '/my-courses';
    case 'flashcards':
      return '/flashcards';
    case 'leaderboard':
      return '/leaderboard';
    case 'ai-assistant':
      return '/ai-assistant';
    case 'my-results':
      return '/my-results';
    case 'weakness-profile':
      return '/weakness-profile';
    default:
      return '/';
  }
}
