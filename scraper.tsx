import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, Copy, Check } from 'lucide-react';

const extractLinks = (html: string): string[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const links = Array.from(doc.getElementsByTagName('a'))
    .map(a => a.href)
    .filter(href => href.startsWith('http')); // Only keep absolute URLs
  return links;
};

const HTMLLinkExtractor: React.FC = () => {
  const [html, setHtml] = useState<string>('');
  const [links, setLinks] = useState<string[]>([]);
  const [message, setMessage] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

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

  const handleCopyLinks = async (): Promise<void> => {
    if (links.length === 0) {
      setMessage('No links to copy.');
      return;
    }

    const linkText = links.join('\n');
    
    try {
      await navigator.clipboard.writeText(linkText);
      setMessage('Links copied to clipboard!');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000); // Reset copy state after 3 seconds
    } catch (err) {
      console.error('Failed to copy links: ', err);
      setMessage('Failed to copy links. Please try again or copy manually.');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <h2 className="text-2xl font-bold">HTML Link Extractor</h2>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Tip: To easily get the HTML of a webpage, right-click on the {'<body>'} tag in the browser's developer tools and select "Copy element".
          </AlertDescription>
        </Alert>
        <Textarea
          value={html}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setHtml(e.target.value)}
          placeholder="Paste your HTML here..."
          className="w-full h-40 mb-4"
        />
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-500">{message}</span>
          <Button onClick={handleCopyLinks} disabled={links.length === 0}>
            {isCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {isCopied ? 'Copied!' : 'Copy Links'}
          </Button>
        </div>
        {links.length > 0 && (
          <div>
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
      </CardContent>
    </Card>
  );
};

export default HTMLLinkExtractor;
