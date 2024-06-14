export interface WebSource {
  index: number;
  title: string;
  url: string;
  content: string;
}

type MediumBase = WebSource & { medium: string };

export type MediumImage = MediumBase & {
  image: string;
  readonly medium: 'image';
};
export type MediumVideo = MediumBase & { readonly medium: 'video' };
