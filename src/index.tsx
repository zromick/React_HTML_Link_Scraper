import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { InfoIcon, Copy, Check } from 'lucide-react';

const HTMLLinkExtractor = () => {
  const [html, setHtml] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const extractLinks = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const links = Array.from(doc.getElementsByTagName('a'))
      .map(a => a.href)
      .filter(href => href.startsWith('http'));
    return links;
  };

  useEffect(() => {
    const extractedLinks = extractLinks(html);
    setLinks(extractedLinks);
    if (extractedLinks.length === 0) {
      setMessage(html.trim() ? 'No links were found in the provided HTML.' : '');
    } else {
      setMessage(`${extractedLinks.length} link${extractedLinks.length === 1 ? '' : 's'} extracted.`);
    }
    setIsCopied(false);
  }, [html]);

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
      console.error('Failed to copy links: ', err);
      setMessage('Failed to copy links. Please try again or copy manually.');
    }
  };

  const tip = 'Tip: To easily get the HTML of a webpage, right-click on the {<body>} tag in the browser\'s developer tools and select "Copy -> Copy element".';

  return (
    <div className="w-full max-w-2xl mx-auto bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <div className="mb-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="alert">
        <InfoIcon className="inline-block mr-2" />
        <span>{tip}</span>
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
            {links.map((link, index) => (
              <li key={index}>
                <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
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
    <h1 className="text-3xl font-bold text-center mb-8">HTML Link Extractor</h1>
    <HTMLLinkExtractor />
  </div>
);

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <App />
);
