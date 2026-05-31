import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Cloak = {
  id: string;
  title: string;
  favicon: string;
  label: string;
};

// Carefully picked: real favicon URLs that work cross-origin.
export const CLOAKS: Cloak[] = [
  { id: "none",    label: "Polaris One",      title: "Polaris One",                              favicon: "" /* uses default */ },
  { id: "gclass",  label: "Google Classroom", title: "Classes",                                  favicon: "https://www.gstatic.com/classroom/favicon.png" },
  { id: "gdocs",   label: "Google Docs",      title: "Untitled document - Google Docs",         favicon: "https://ssl.gstatic.com/docs/documents/images/kix-favicon-2023q4.ico" },
  { id: "gdrive",  label: "Google Drive",     title: "My Drive - Google Drive",                  favicon: "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png" },
  { id: "gmail",   label: "Gmail",            title: "Inbox - Gmail",                            favicon: "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico" },
  { id: "khan",    label: "Khan Academy",     title: "Khan Academy | Free Online Courses",       favicon: "https://cdn.kastatic.org/images/favicon.ico?logo" },
  { id: "wiki",    label: "Wikipedia",        title: "Wikipedia, the free encyclopedia",         favicon: "https://en.wikipedia.org/static/favicon/wikipedia.ico" },
  { id: "canvas",  label: "Canvas LMS",       title: "Dashboard",                                favicon: "https://du11hjcvx0uqb.cloudfront.net/dist/images/favicon-e10d657a73.ico" },
  { id: "youtube", label: "YouTube",          title: "YouTube",                                  favicon: "https://www.youtube.com/s/desktop/12d6b690/img/favicon_32x32.png" },
];

type Ctx = {
  cloak: Cloak;
  setCloakId: (id: string) => void;
  cloaks: Cloak[];
};
const CloakCtx = createContext<Ctx | null>(null);
const STORAGE_KEY = "polaris-cloak-id";

function setFavicon(href: string) {
  if (typeof document === "undefined") return;
  let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.type = "image/x-icon";
  if (href) link.href = href;
  else link.removeAttribute("href");
}

export function TabCloakProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<string>("none");
  // hydrate once
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && CLOAKS.find((c) => c.id === stored)) setId(stored);
    } catch { /* noop */ }
  }, []);

  const cloak = useMemo(() => CLOAKS.find((c) => c.id === id) ?? CLOAKS[0], [id]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (cloak.id === "none") {
      // restore original
      document.title = "Polaris One — Web OS";
      setFavicon(""); // leave whatever the doc shipped with
    } else {
      document.title = cloak.title;
      setFavicon(cloak.favicon);
    }
  }, [cloak]);

  const setCloakId = useCallback((next: string) => {
    setId(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* noop */ }
  }, []);

  return (
    <CloakCtx.Provider value={{ cloak, setCloakId, cloaks: CLOAKS }}>
      {children}
    </CloakCtx.Provider>
  );
}

export function useTabCloak() {
  const ctx = useContext(CloakCtx);
  if (!ctx) throw new Error("useTabCloak outside TabCloakProvider");
  return ctx;
}