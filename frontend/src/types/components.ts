export interface GalleryImage {
  id?: string;
  thumbnailUrl: string;
  imageUrl: string;
  label: string;
}

export interface DropdownInputDef {
  key: string;
  options: { label: string; value: string }[];
  value: string;
  defaultValue?: string;
  placeholder?: string;
}
