export type Alignment = 'left' | 'center' | 'right'
export type VerticalAlign = 'top' | 'center' | 'bottom'
export type WidthType = 'boxed' | 'full' | 'custom'
export type BgWidthType = 'full' | 'custom'
export type BackgroundType = 'color' | 'image' | 'gradient'
export type PaddingSize = 'small' | 'medium' | 'large' | 'custom'

export interface HeadingBlock {
  id: string
  type: 'heading'
  level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  text: string
  alignment: Alignment
  color: string
  custom_size?: number
  custom_unit?: 'px' | 'em'
}

export interface TextBlock {
  id: string
  type: 'text'
  content: string
  alignment: Alignment
  color: string
  font_size?: number
  font_size_unit?: 'px' | 'em'
}

export interface ImageBlock {
  id: string
  type: 'image'
  url: string
  alt: string
  link_url: string | null
  link_target: '_self' | '_blank'
  object_fit: 'cover' | 'contain'
}

export interface ButtonBlock {
  id: string
  type: 'button'
  text: string
  url: string
  target: '_self' | '_blank'
  style: 'filled' | 'outline' | 'text'
  color: string
  alignment: Alignment
  font_size?: number
}

export interface VideoBlock {
  id: string
  type: 'video'
  url: string
  alignment: Alignment
}

export interface DividerBlock {
  id: string
  type: 'divider'
  color: string
  thickness: number
}

export interface SpacerBlock {
  id: string
  type: 'spacer'
  height: number
}

export interface SliderBlock {
  id: string
  type: 'slider'
  category_slug?: string
}

export interface CalculatorBlock {
  id: string
  type: 'calculator'
}

export interface ContactFormBlock {
  id: string
  type: 'contact_form'
}

export interface TegevusaladBlock {
  id: string
  type: 'tegevusalad'
  columns: 2 | 3 | 4 | 5 | 6
  // new independent toggles (legacy card_style kept for compat)
  card_has_bg?: boolean
  card_has_border?: boolean
  card_style?: 'filled' | 'outlined'
  icon_size: 'small' | 'medium' | 'large'
  card_bg_color?: string       // solid hex or linear-gradient(...)
  card_border_color?: string   // solid hex or linear-gradient(...)
  card_hover_bg?: string       // solid hex or linear-gradient(...)
  card_height?: number
  card_shadow?: 'none' | 'sm' | 'md' | 'lg'
  card_hover_shadow?: 'none' | 'sm' | 'md' | 'lg'
}

export interface SearchBarBlock {
  id: string
  type: 'search_bar'
  bg_color: string
  btn_color: string
  text_color: string
  max_width: number | null
}

export interface MapBlock {
  id: string
  type: 'map'
}

export type ContentBlock =
  | HeadingBlock
  | TextBlock
  | ImageBlock
  | ButtonBlock
  | VideoBlock
  | DividerBlock
  | SpacerBlock
  | SliderBlock
  | CalculatorBlock
  | ContactFormBlock
  | SearchBarBlock
  | TegevusaladBlock
  | MapBlock

export interface Column {
  id: string
  width: number
  vertical_align: VerticalAlign
  blocks: ContentBlock[]
  border_radius_tl?: number
  border_radius_tr?: number
  border_radius_bl?: number
  border_radius_br?: number
}

export interface SectionSettings {
  width: WidthType
  width_custom?: number
  bg_width?: BgWidthType
  bg_width_custom?: number
  background_type: BackgroundType
  background_color: string
  background_image_url: string | null
  background_overlay: number
  background_overlay_css?: string  // overrides opacity slider when set
  background_gradient_color1?: string
  background_gradient_color2?: string
  background_gradient_direction?: string
  padding_top: PaddingSize
  padding_bottom: PaddingSize
  padding_x?: PaddingSize
  padding_top_custom?: number
  padding_bottom_custom?: number
  padding_x_custom?: number
  border_radius_tl?: number
  border_radius_tr?: number
  border_radius_bl?: number
  border_radius_br?: number
}

export interface Section {
  id: string
  type: 'section'
  order: number
  settings: SectionSettings
  columns: Column[]
}

export interface PageFormData {
  title: string
  slug: string
  short_description: string
  status: 'draft' | 'published'
  visibility: 'public' | 'private'
  show_in_nav: boolean
  nav_label: string
  meta_title: string
  meta_description: string
  og_image_url: string
  show_title: boolean
  blocks: Section[]
}
