import Link from 'next/link';
import { MediumImage, MediumVideo } from '@/types';
import { WidgetSkeleton } from './Skeletons';

interface ImageVideoWidgetProps {
  mediums: (MediumImage | MediumVideo)[] | null;
}

export default function ImageVideoWidget(props: ImageVideoWidgetProps) {
  return (
    <div className="mb-2">
      {props.mediums === null ? (
        <WidgetSkeleton />
      ) : (
        <div className="grid md:grid-cols-2 grid-cols-4 gap-2">
          {props.mediums.slice(0, 4).map((medium) => (
            <div
              key={medium.url}
              className="h-24 md:h-48 bg-accent rounded-md overflow-hidden shadow-md hover:scale-[1.03] hover:shadow-lg duration-200 animate-slide-down"
            >
              {medium.medium === 'image' ? (
                <Link key={medium.image} href={medium.image} target="_blank">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    loading="lazy"
                    src={medium.image}
                    alt={medium.title}
                    className="h-full w-full object-cover rounded-md transition-all ease-in-out"
                  />
                </Link>
              ) : medium.medium === 'video' ? (
                medium.url.includes('youtube') ? (
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${new URLSearchParams(
                      new URL(medium.url).search
                    ).get('v')}`}
                    title={medium.title}
                    style={{ border: 0 }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <video
                    controls
                    className="h-full w-full object-cover rounded-md"
                  >
                    <source src={medium.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
