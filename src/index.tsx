import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { InfoIcon, Copy, Check, SortAsc } from 'lucide-react';

const HTMLLinkScraper: React.FC = () => {
  const [html, setHtml] = useState<string>('');
  const [links, setLinks] = useState<string[]>([]);
  const [message, setMessage] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [baseUrl, setBaseUrl] = useState<string>('https://');
  const [isSorted, setIsSorted] = useState<boolean>(false);
  const [topBaseUrls, setTopBaseUrls] = useState<string[]>([]);
  const [isCustomUrl, setIsCustomUrl] = useState<boolean>(true);
  const maxDisplayLength = 100;
  const maxTopUrls = 10;

  const extractTopBaseUrls = (html: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s/$.?#].[^\s]*)/gi;
    const matches = html.match(urlRegex) || [];

    const baseUrls = matches.map(url => {
      try {
        const parsedUrl = new URL(url);
        return `${parsedUrl.protocol}//${parsedUrl.hostname}`;
      } catch (error) {
        return null;
      }
    }).filter((url): url is string => url !== null);

    const urlCounts = baseUrls.reduce<Record<string, number>>((acc, url) => {
      acc[url] = (acc[url] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(urlCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxTopUrls)
      .map(([url]) => url);
  };

  const extractLinks = (html: string, baseUrl: string): string[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const links = Array.from(doc.getElementsByTagName('a'))
      .map(a => {
        const href = a.getAttribute('href');
        if (!href) return null;
        try {
          return new URL(href, baseUrl).href;
        } catch {
          return href;
        }
      });
    return links.filter((link): link is string => link !== null);
  };

  useEffect(() => {
    const extractedTopBaseUrls = extractTopBaseUrls(html);
    setTopBaseUrls(extractedTopBaseUrls);
  }, [html]);

  useEffect(() => {
    if (html && baseUrl) {
      const extractedLinks = extractLinks(html, baseUrl);
      setLinks(extractedLinks);
      if (extractedLinks.length === 0) {
        setMessage(html.trim() ? 'No links were found in the provided HTML.' : '');
      } else {
        setMessage(`${extractedLinks.length} link${extractedLinks.length === 1 ? '' : 's'} extracted.`);
      }
      setIsCopied(false);
      setIsSorted(false);
    }
  }, [html, baseUrl]);

  const handleBaseUrlChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'custom') {
      setIsCustomUrl(true);
      setBaseUrl('https://');
    } else {
      setIsCustomUrl(false);
      setBaseUrl(value);
    }
  };

  const handleCustomBaseUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBaseUrl(e.target.value);
  };

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

  const truncateDisplayText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 3)}...`;
  };

  const tip = `The purpose of this site is to easily scrape a webpage for links.

  Here's how to do it:

  1. Enter the base URL for the webpage you're scraping in the "Custom URL" field.
  2. Right-click on the webpage and select "Inspect" (or "Inspect Element" depending on your browser).
  3. Look for the "Elements" tab and navigate to it.
  4. Right-click on the {<body>} tag in the Elements panel.
  5. Choose "Copy" -> "Copy element".
  6. Paste the copied HTML into the text box below.

  Note: The top 10 most common base URLs will be automatically extracted from the HTML and added to the dropdown menu.`;

  return (
    <div className="w-full max-w-2xl mx-auto bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <div className="mb-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="alert">
        <InfoIcon className="inline-block mr-2" />
        <span style={{ whiteSpace: 'pre-wrap' }}>{tip}</span>
      </div>
      <div className="mb-4">
        <label htmlFor="baseUrlSelect" className="block text-gray-700 text-sm font-bold mb-2">
          Select Base URL:
        </label>
        <select
          id="baseUrlSelect"
          value={isCustomUrl ? 'custom' : baseUrl}
          onChange={handleBaseUrlChange}
          className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none mb-2"
        >
          <option value="custom">Custom URL</option>
          {topBaseUrls.map((url, index) => (
            <option key={index} value={url}>
              {url}
            </option>
          ))}
        </select>
        {isCustomUrl && (
          <input
            type="text"
            value={baseUrl}
            onChange={handleCustomBaseUrlChange}
            placeholder="Enter custom base URL"
            className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
          />
        )}
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
