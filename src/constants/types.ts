interface ProfileProps {
  avatar?: NodeRequire;
  name?: string;
  type?: string;
  rating?: string;
}

interface DefaultMenuProps {
  id?: string;
  title?: string;
}

interface ProductProps {
  title?: string;
  image?: any;
  price?: number;
  horizontal?: boolean;
}

interface ItemProps {
  title?: string;
  id: string;
  type?: string;
}

export type { ProfileProps, DefaultMenuProps, ProductProps, ItemProps };
