import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { InfoIcon, Copy, Check } from 'lucide-react';

const HTMLLinkScraper = () => {
  const [html, setHtml] = useState<string>('');
  const [links, setLinks] = useState<(string | null)[]>([]);
  const [message, setMessage] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [baseUrl, setBaseUrl] = useState<string>('');
  const useFullUrls = true; // Always use full URLs

  const extractBaseUrl = (html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Try to extract base URL from <base> tag
    const baseTag = doc.querySelector('base');
    if (baseTag && baseTag.href) {
      return new URL(baseTag.href).origin;
    }

    // Try to extract from first <a> tag with an absolute URL
    const firstLink = doc.querySelector('a[href^="http"]') as HTMLAnchorElement;
    if (firstLink && firstLink.href) {
      return new URL(firstLink.href).origin;
    }

    // If no base URL found, return empty string
    return '';
  };

  const extractLinks = (html: string, baseUrl: string, useFullUrls: boolean): (string | null)[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const links = Array.from(doc.getElementsByTagName('a'))
      .map(a => {
        const href = a.getAttribute('href');
        if (href && href.startsWith('http')) {
          return href;
        } else if (href && useFullUrls && baseUrl) {
          return new URL(href, baseUrl).href;
        } else if (href) {
          return useFullUrls && baseUrl ? new URL(href, baseUrl).href : `{base_url}${href.startsWith('/') ? '' : '/'}${href}`;
        }
        return null;
      });
    return links;
  };

  useEffect(() => {
    const extractedBaseUrl = extractBaseUrl(html);
    if (extractedBaseUrl && !baseUrl) {
      setBaseUrl(extractedBaseUrl);
    }

    const extractedLinks = extractLinks(html, baseUrl || extractedBaseUrl, useFullUrls);
    setLinks(extractedLinks);
    if (extractedLinks.length === 0) {
      setMessage(html.trim() ? 'No links were found in the provided HTML.' : '');
    } else {
      setMessage(`${extractedLinks.length} link${extractedLinks.length === 1 ? '' : 's'} extracted.`);
    }
    setIsCopied(false);
  }, [html, baseUrl, useFullUrls]);

  const handleCopyLinks = async () => {
    if (links.length === 0) {
      setMessage('No links to copy.');
      return;
    }

    const linkText = links.filter(Boolean).join('\n');

    try {
      await navigator.clipboard.writeText(linkText);
      setMessage('Links copied to clipboard!');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy links: ', err);
      setMessage('Failed to copy links. Please try again or copy manually.');
    }
  };

  const tip = `The purpose of this site is to easily scrape a webpage for links.

  Here's how to do it:

  1. Right-click on a webpage and select "Inspect" (or "Inspect Element" depending on your browser).
  2. Look for the "Elements" tab and navigate to it.
  3. Right-click on the {<body>} tag in the Elements panel.
  4. Choose "Copy" -> "Copy element".
  5. Paste the copied HTML into the text box below.
  6. The base URL will be automatically extracted if possible. You can manually adjust it if needed.

  Note: All URLs will be displayed as full URLs when possible.`;

  return (
    <div className="w-full max-w-2xl mx-auto bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <div className="mb-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="alert">
        <InfoIcon className="inline-block mr-2" />
        <span style={{ whiteSpace: 'pre-wrap' }}>{tip}</span>
      </div>
      <div className="mb-4">
        <input
          type="text"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="Base URL (auto-detected or enter manually)"
          className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
        />
      </div>
      <textarea
        value={html}
        onChange={(e) => setHtml(e.target.value)}
        placeholder="Paste your HTML here..."
        className="w-full h-40 px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
        rows={4}
      />
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm text-gray-500">{message}</span>
        <button
          onClick={handleCopyLinks}
          disabled={links.length === 0}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
        >
          {isCopied ? <Check className="inline-block mr-2" /> : <Copy className="inline-block mr-2" />}
          {isCopied ? 'Copied!' : 'Copy Links'}
        </button>
      </div>
      {links.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xl font-semibold mb-2">Extracted Links:</h3>
          <ul className="list-disc pl-5">
            {links.filter(Boolean).map((link, index) => (
              <li key={index} className="mb-2">
                <a
                  href={link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline break-words"
                  style={{ marginLeft: '30px', display: 'inline-block', maxWidth: 'calc(100% - 30px)' }}
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};


const App = () => (
  <div>
    <h1 className="text-3xl font-bold text-center mb-8">HTML Link Scraper</h1>
    <HTMLLinkScraper />
  </div>
);

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <App />
);
