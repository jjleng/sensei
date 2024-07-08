import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Citation from '@/components/Citation';
import CopyButton from '@/components/CopyButton';

interface Props {
  richContent: string;
  enableMath?: boolean;
}

const RichContentRenderer: React.FC<Props> = ({ richContent }) => {
  const enableMath = true;
  const remarkPlugins: any = [remarkGfm];
  if (enableMath) {
    remarkPlugins.push(remarkMath);
  }

  return (
    <div className="rich-content-renderer mb-4 overflow-x-auto prose dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={[rehypeRaw, ...(enableMath ? [rehypeKatex] : [])]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="relative">
                <CopyButton code={String(children).replace(/\n$/, '')} />
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className={`${className || ''} font-semibold`} {...props}>
                {children}
              </code>
            );
          },
          a({ node, ...props }: any) {
            const { href, children } = props;
            if (children && children?.[0].match(/^\d+$/)) {
              const citationNumber = children[0];
              return (
                <a
                  href={href}
                  className="inline-block not-prose"
                  style={{ verticalAlign: 'top', paddingTop: 2 }}
                  target="_blank"
                >
                  <Citation number={Number(citationNumber)} />
                </a>
              );
            }
            return <a {...props}>{children}</a>;
          },
        }}
      >
        {richContent}
      </ReactMarkdown>
    </div>
  );
};

export default RichContentRenderer;
