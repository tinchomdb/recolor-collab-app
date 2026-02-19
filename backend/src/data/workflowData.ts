import type { CreateTicketInput, PhotoOption } from "@shared/types";

export const STYLE_OPTIONS = [
  "Night Sky - AOP White Dots",
  "Hedge Green - solid",
  "Navy Blazer - solid",
  "Granita - solid",
  "Fuchsia Fedora - AOP Block Libre",
];

export const PHOTO_OPTIONS: PhotoOption[] = [
  {
    id: "15377489_5081878_001",
    label: "Photo 1",
    fileName: "15377489_5081878_001.jpg",
    thumbnailUrl: "/api/assets/thumbnails/15377489_5081878_001.jpg",
    imageUrl: "/api/assets/images/15377489_5081878_001.jpg",
  },
  {
    id: "15377489_5081878_002",
    label: "Photo 2",
    fileName: "15377489_5081878_002.jpg",
    thumbnailUrl: "/api/assets/thumbnails/15377489_5081878_002.jpg",
    imageUrl: "/api/assets/images/15377489_5081878_002.jpg",
  },
  {
    id: "15377489_5081878_007",
    label: "Photo 3",
    fileName: "15377489_5081878_007.jpg",
    thumbnailUrl: "/api/assets/thumbnails/15377489_5081878_007.jpg",
    imageUrl: "/api/assets/images/15377489_5081878_007.jpg",
  },
  {
    id: "15377486_5078866_001",
    label: "Photo 4",
    fileName: "15377486_5078866_001.jpg",
    thumbnailUrl: "/api/assets/thumbnails/15377486_5078866_001.jpg",
    imageUrl: "/api/assets/images/15377486_5078866_001.jpg",
  },
  {
    id: "15377486_5078866_002",
    label: "Photo 5",
    fileName: "15377486_5078866_002.jpg",
    thumbnailUrl: "/api/assets/thumbnails/15377486_5078866_002.jpg",
    imageUrl: "/api/assets/images/15377486_5078866_002.jpg",
  },
  {
    id: "15377486_5078866_007",
    label: "Photo 6",
    fileName: "15377486_5078866_007.jpg",
    thumbnailUrl: "/api/assets/thumbnails/15377486_5078866_007.jpg",
    imageUrl: "/api/assets/images/15377486_5078866_007.jpg",
  },
  {
    id: "15377488_5078869_001",
    label: "Photo 7",
    fileName: "15377488_5078869_001.jpg",
    thumbnailUrl: "/api/assets/thumbnails/15377488_5078869_001.jpg",
    imageUrl: "/api/assets/images/15377488_5078869_001.jpg",
  },
  {
    id: "15377488_5078869_002",
    label: "Photo 8",
    fileName: "15377488_5078869_002.jpg",
    thumbnailUrl: "/api/assets/thumbnails/15377488_5078869_002.jpg",
    imageUrl: "/api/assets/images/15377488_5078869_002.jpg",
  },
  {
    id: "15377488_5078869_007",
    label: "Photo 9",
    fileName: "15377488_5078869_007.jpg",
    thumbnailUrl: "/api/assets/thumbnails/15377488_5078869_007.jpg",
    imageUrl: "/api/assets/images/15377488_5078869_007.jpg",
  },
  {
    id: "15377522_5081887_001",
    label: "Photo 10",
    fileName: "15377522_5081887_001.jpg",
    thumbnailUrl: "/api/assets/thumbnails/15377522_5081887_001.jpg",
    imageUrl: "/api/assets/images/15377522_5081887_001.jpg",
  },
  {
    id: "15377522_5081887_002",
    label: "Photo 11",
    fileName: "15377522_5081887_002.jpg",
    thumbnailUrl: "/api/assets/thumbnails/15377522_5081887_002.jpg",
    imageUrl: "/api/assets/images/15377522_5081887_002.jpg",
  },
  {
    id: "15377522_5081887_007",
    label: "Photo 12",
    fileName: "15377522_5081887_007.jpg",
    thumbnailUrl: "/api/assets/thumbnails/15377522_5081887_007.jpg",
    imageUrl: "/api/assets/images/15377522_5081887_007.jpg",
  },
  {
    id: "dots-cloud-dancer",
    label: "DOTS CLOUD DANCER",
    fileName: "DOTS CLOUD DANCER.jpg",
    thumbnailUrl: "/api/assets/thumbnails/DOTS%20CLOUD%20DANCER.jpg",
    imageUrl: "/api/assets/images/DOTS%20CLOUD%20DANCER.jpg",
  },
  {
    id: "block-libre",
    label: "BLOCK LIBRE",
    fileName: "Block Libre.jpg",
    thumbnailUrl: "/api/assets/thumbnails/Block%20Libre.jpg",
    imageUrl: "/api/assets/images/Block%20Libre.jpg",
  },
];

/** Pick PhotoOption entries by index from the catalog. */
function photos(...indexes: number[]): PhotoOption[] {
  return indexes.map((i) => PHOTO_OPTIONS[i]);
}

export const SEEDED_TICKETS: CreateTicketInput[] = [
  {
    style: "Granita - solid",
    priority: "Medium",
    partner: "Studio Alpha",
    instructions: [
      "Keep clipping path for all pictures (only 1 clipping path)",
      "Granita - solid",
      "Fuchsia Fedora with AOP Block Libre",
    ],
    referencePhotos: photos(0, 1, 2, 13),
  },
  {
    style: "Night Sky - AOP White Dots",
    priority: "High",
    partner: "Studio Alpha",
    instructions: [
      "Keep clipping path for all pictures (only 1 clipping path)",
      "Night Sky + AOP White Dots (DOTS CLOUD DANCER recoloured to Night Sky)",
      "Hedge Green - solid",
      "Navy Blazer - solid",
    ],
    referencePhotos: photos(3, 4, 5, 12),
  },
  {
    style: "Navy Blazer - solid",
    priority: "Low",
    partner: "Studio Beta",
    instructions: [
      "Keep clipping path for all pictures (only 1 clipping path)",
      "Night Sky + AOP White Dots",
      "Hedge Green - solid",
      "Navy Blazer - solid",
    ],
    referencePhotos: photos(6, 7, 8, 12),
  },
  {
    style: "Fuchsia Fedora - AOP Block Libre",
    priority: "Urgent",
    partner: "Studio Gamma",
    instructions: [
      "Keep clipping path for all pictures (only 1 clipping path)",
      "Granita - solid",
      "Fuchsia Fedora with AOP Block Libre",
    ],
    referencePhotos: photos(9, 10, 11, 13),
  },
];
