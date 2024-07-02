import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { InfoIcon, Copy, Check, SortAsc } from 'lucide-react';

const HTMLLinkScraper = () => {
  const [html, setHtml] = useState<string>('');
  const [links, setLinks] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [isSorted, setIsSorted] = useState(false);
  const useFullUrls = true;
  const maxDisplayLength = 100;

  const extractMostCommonBaseUrl = (html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const anchors = Array.from(doc.getElementsByTagName('a'));
    const hrefs = anchors.map(a => a.getAttribute('href')).filter(Boolean) as string[];
    const fullUrls = hrefs.filter(href => href.startsWith('http'));

    if (fullUrls.length === 0) {
      return '';
    }

    const baseUrls = fullUrls.map(url => {
      try {
        const parsedUrl = new URL(url);
        return `${parsedUrl.protocol}//${parsedUrl.hostname}`;
      } catch (error) {
        return null;
      }
    }).filter(Boolean) as string[];

    if (baseUrls.length === 0) {
      return '';
    }

    const urlCounts = baseUrls.reduce((acc, url) => {
      acc[url] = (acc[url] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommonBaseUrl = Object.entries(urlCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];

    return mostCommonBaseUrl || '';
  };

  const extractLinks = (html: string, baseUrl: string, useFullUrls: boolean) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const links = Array.from(doc.getElementsByTagName('a'))
      .map(a => {
        const href = a.getAttribute('href');
        if (href && href.startsWith('http')) {
          return href;
        } else if (href && useFullUrls && baseUrl) {
          try {
            return new URL(href, baseUrl).href;
          } catch {
            return href;
          }
        } else if (href && href.startsWith('/')) {
          return useFullUrls && baseUrl ? `${baseUrl}${href}` : `{base_url}${href}`;
        } else if (href) {
          return useFullUrls && baseUrl ? `${baseUrl}/${href}` : `{base_url}/${href}`;
        }
        return null;
      });
    return [...new Set(links)].filter(Boolean) as string[];
  };

  useEffect(() => {
    const extractedBaseUrl = extractMostCommonBaseUrl(html);
    setBaseUrl(extractedBaseUrl);
    const extractedLinks = extractLinks(html, extractedBaseUrl, useFullUrls);
    setLinks(extractedLinks);
    if (extractedLinks.length === 0) {
      setMessage(html.trim() ? 'No links were found in the provided HTML.' : '');
    } else {
      setMessage(`${extractedLinks.length} link${extractedLinks.length === 1 ? '' : 's'} extracted.`);
    }
    setIsCopied(false);
    setIsSorted(false);
  }, [html, useFullUrls]);

  const handleCopyLinks = async () => {
    if (links.length === 0) {
      setMessage('No links to copy.');
      return;
    }

    const linkText = links.join('\n');

    try {
      await navigator.clipboard.writeText(linkText);
      setMessage('Links copied to clipboard!');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      setMessage('Failed to copy links. Please try again or copy manually.');
    }
  };

  const handleSortLinks = () => {
    const sortedLinks = [...links].sort((a, b) => a.localeCompare(b));
    setLinks(sortedLinks);
    setIsSorted(true);
  };

  const truncateDisplayText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 3) }...`;
  };

  const tip = `The purpose of this site is to easily scrape a webpage for links.

  Here's how to do it:

  1. Right-click on a webpage and select "Inspect" (or "Inspect Element" depending on your browser).
  2. Look for the "Elements" tab and navigate to it.
  3. Right-click on the {<body>} tag in the Elements panel.
  4. Choose "Copy" -> "Copy element".
  5. Paste the copied HTML into the text box below.

  Note: The base URL will be automatically extracted from the most common URL in the HTML.`;

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
          placeholder="Base URL (automatically detected)"
          className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
          readOnly
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
        <div>
          <button
            onClick={handleSortLinks}
            disabled={links.length === 0 || isSorted}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 mr-2"
          >
            <SortAsc className="inline-block mr-2" />
            Sort Links A-Z
          </button>
          <button
            onClick={handleCopyLinks}
            disabled={links.length === 0}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            {isCopied ? <Check className="inline-block mr-2" /> : <Copy className="inline-block mr-2" />}
            {isCopied ? 'Copied!' : 'Copy Links'}
          </button>
        </div>
      </div>
      {links.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xl font-semibold mb-2">Extracted Links:</h3>
          <ul className="list-disc pl-5">
            {links.map((link, index) => (
              <li key={index} className="mb-2">
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline break-words"
                  style={{ marginLeft: '30px', display: 'inline-block', maxWidth: 'calc(100% - 30px)' }}
                  title={link}
                >
                  {truncateDisplayText(link, maxDisplayLength)}
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
