'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MDXContent from '@/components/mdx/MDXContent';
import TableEditor from './TableEditor';
import CodeBlockEditor from './CodeBlockEditor';
import ColumnEditor from './ColumnEditor';
import MathEditor from './MathEditor';
import ButtonEditor from './ButtonEditor';

interface DBSection {
  id: string;
  title: string;
  description: string | null;
  order: number;
  categories: DBCategory[];
}

interface DBCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sectionId: string | null;
  order: number;
  children: DBCategory[];
}

interface PostTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  tags: string[];
  content: string;
}

interface PostEditorProps {
  initialData?: {
    slug?: string;
    title?: string;
    description?: string;
    category?: string;
    tags?: string[];
    content?: string;
    date?: string;
    thumbnail?: string;
    thumbnailPosition?: number;
    thumbnailScale?: number;
    isPublic?: boolean;
  };
  isEdit?: boolean;
}

interface ToolbarButton {
  icon: React.ReactNode;
  label: string;
  action: (textarea: HTMLTextAreaElement, content: string, setContent: (c: string) => void) => void;
}

const codeLanguages = [
  'javascript', 'typescript', 'python', 'html', 'css', 'json', 'bash', 'sql',
  'java', 'cpp', 'csharp', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin',
  'markdown', 'yaml', 'xml', 'text',
];

export default function PostEditor({ initialData = {}, isEdit = false }: PostEditorProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'split'>('split');
  const [showTableEditor, setShowTableEditor] = useState(false);
  const [showCodeBlockEditor, setShowCodeBlockEditor] = useState(false);
  const [showCodeLanguageDropdown, setShowCodeLanguageDropdown] = useState(false);
  const [showColumnEditor, setShowColumnEditor] = useState(false);
  const [showMathEditor, setShowMathEditor] = useState(false);
  const [showButtonEditor, setShowButtonEditor] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState('😀 스마일');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templates, setTemplates] = useState<PostTemplate[]>([]);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [categories, setCategories] = useState<DBCategory[]>([]);

  // Category management state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryParentId, setNewCategoryParentId] = useState<string>('');
  const [newCategorySectionId, setNewCategorySectionId] = useState<string>('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<DBCategory | null>(null);
  const [editingName, setEditingName] = useState('');

  // Section management state
  const [dbSections, setDbSections] = useState<DBSection[]>([]);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionDescription, setNewSectionDescription] = useState('');
  const [editingSection, setEditingSection] = useState<DBSection | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState('');
  const [editingSectionDescription, setEditingSectionDescription] = useState('');

  // Parse initial category into parent and sub
  const parseCategory = (category: string) => {
    if (!category) return { parent: '', sub: '' };
    const parts = category.split('/');
    return { parent: parts[0], sub: parts[1] || '' };
  };

  const initialCategoryParsed = parseCategory(initialData.category || '');
  const [selectedParentCategory, setSelectedParentCategory] = useState(initialCategoryParsed.parent);
  const [selectedSubCategory, setSelectedSubCategory] = useState(initialCategoryParsed.sub);

  // Get local date string to avoid UTC timezone issues
  const getLocalDateStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const [formData, setFormData] = useState({
    slug: initialData.slug || '',
    title: initialData.title || '',
    description: initialData.description || '',
    category: initialData.category || '',
    tags: initialData.tags?.join(', ') || '',
    content: initialData.content || '',
    date: initialData.date || getLocalDateStr(),
    thumbnail: initialData.thumbnail || '',
    thumbnailPosition: initialData.thumbnailPosition ?? 50,
    thumbnailScale: initialData.thumbnailScale ?? 100,
    isPublic: initialData.isPublic !== false,
  });

  // Emoji categories for picker
  const emojiCategories = {
    '😀 스마일': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐'],
    '😾 동물': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🦣', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🪶', '🐓', '🦃', '🦤', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦫', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔'],
    '🍔 음식': ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '🫖', '☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊', '🥄', '🍴', '🍽️', '🥣', '🥡', '🥢', '🧂'],
    '⚽ 활동': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🪘', '🎷', '🎺', '🪗', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩'],
    '🚗 여행': ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵', '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🛰️', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓', '🪝', '⛽', '🚧', '🚦', '🚥', '🚏', '🗺️', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟️', '🎡', '🎢', '🎠', '⛲', '⛱️', '🏖️', '🏝️', '🏜️', '🌋', '⛰️', '🏔️', '🗻', '🏕️', '⛺', '🛖', '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩', '💒', '🏛️', '⛪', '🕌', '🕍', '🛕', '🕋', '⛩️', '🛤️', '🛣️', '🗾', '🎑', '🏞️', '🌅', '🌄', '🌠', '🎇', '🎆', '🌇', '🌆', '🏙️', '🌃', '🌌', '🌉', '🌁'],
    '💡 물건': ['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪚', '🔩', '⚙️', '🪤', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🪠', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🛀', '🧼', '🪥', '🪒', '🧽', '🪣', '🧴', '🛎️', '🔑', '🗝️', '🚪', '🪑', '🛋️', '🛏️', '🛌', '🧸', '🪆', '🖼️', '🪞', '🪟', '🛍️', '🛒', '🎁', '🎈', '🎏', '🎀', '🪄', '🪅', '🎊', '🎉', '🎎', '🏮', '🎐', '🧧', '✉️', '📩', '📨', '📧', '💌', '📥', '📤', '📦', '🏷️', '🪧', '📪', '📫', '📬', '📭', '📮', '📯', '📜', '📃', '📄', '📑', '🧾', '📊', '📈', '📉', '🗒️', '🗓️', '📆', '📅', '🗑️', '📇', '🗃️', '🗳️', '🗄️', '📋', '📁', '📂', '🗂️', '🗞️', '📰', '📓', '📔', '📒', '📕', '📗', '📘', '📙', '📚', '📖', '🔖', '🧷', '🔗', '📎', '🖇️', '📐', '📏', '🧮', '📌', '📍', '✂️', '🖊️', '🖋️', '✒️', '🖌️', '🖍️', '📝', '✏️', '🔍', '🔎', '🔏', '🔐', '🔒', '🔓'],
    '❤️ 하트': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️'],
    '🔣 기호': ['💯', '🔢', '❌', '⭕', '🚫', '🚷', '🚯', '🚳', '🚱', '📵', '🔞', '☢️', '☣️', '⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️', '↕️', '↔️', '↩️', '↪️', '⤴️', '⤵️', '🔃', '🔄', '🔙', '🔚', '🔛', '🔜', '🔝', '🔀', '🔁', '🔂', '▶️', '⏩', '⏭️', '⏯️', '◀️', '⏪', '⏮️', '🔼', '⏫', '🔽', '⏬', '⏸️', '⏹️', '⏺️', '⏏️', '🎦', '🔅', '🔆', '📶', '📳', '📴', '♀️', '♂️', '⚧️', '✖️', '➕', '➖', '➗', '♾️', '‼️', '⁉️', '❓', '❔', '❕', '❗', '〰️', '💱', '💲', '⚕️', '♻️', '⚜️', '🔱', '📛', '🔰', '⭐', '🌟', '💫', '✨', '⚡', '🔥', '💥', '☄️', '🌈', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '🌪️', '🌫️', '🌊', '💧', '💦', '☔', '☂️', '🌂', '🌀', '🌍', '🌎', '🌏', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌙', '🌚', '🌛', '🌜', '🪐', '⭐', '🌟', '✨'],
    '🌸 자연': ['🌸', '💮', '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🪴', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🍄', '🌰', '🦀', '🦞', '🦐', '🦑', '🌍', '🌎', '🌏', '🌐', '🪨', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌙', '🌚', '🌛', '🌜', '☀️', '🌝', '🌞', '🪐', '⭐', '🌟', '🌠', '🌌', '☁️', '⛅', '⛈️', '🌤️', '🌥️', '🌦️', '🌧️', '🌨️', '🌩️', '🌪️', '🌫️', '🌬️', '🌀', '🌈', '🌂', '☂️', '☔', '⛱️', '⚡', '❄️', '☃️', '⛄', '☄️', '🔥', '💧', '🌊'],
  };

  // Update formData.category when parent or sub category changes
  useEffect(() => {
    const newCategory = selectedSubCategory
      ? `${selectedParentCategory}/${selectedSubCategory}`
      : selectedParentCategory;
    setFormData(prev => ({ ...prev, category: newCategory }));
  }, [selectedParentCategory, selectedSubCategory]);

  // Get subcategories for selected parent
  const getSubcategories = () => {
    const parent = categories.find(c => c.name === selectedParentCategory);
    return parent?.children || [];
  };

  // Fetch categories from database
  const fetchCategories = async () => {
    try {
      // First sync categories from MDX
      await fetch('/api/admin/categories/sync', { method: 'POST' });
      // Then fetch
      const res = await fetch('/api/admin/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  // Fetch sections from database
  const fetchSections = async () => {
    try {
      const res = await fetch('/api/admin/sections');
      if (res.ok) {
        const data = await res.json();
        setDbSections(data);
      }
    } catch (error) {
      console.error('Failed to fetch sections:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchSections();
  }, []);

  // Refresh when modals close
  useEffect(() => {
    if (!showCategoryModal) {
      fetchCategories();
      fetchSections();
    }
  }, [showCategoryModal]);

  useEffect(() => {
    if (!showSectionModal) {
      fetchSections();
    }
  }, [showSectionModal]);

  // Create new category
  const handleCreateCategory = async (autoSelectAsParent: boolean = false) => {
    if (!newCategoryName.trim()) return;

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          parentId: newCategoryParentId || null,
          sectionId: newCategorySectionId || null,
        }),
      });
      if (res.ok) {
        const createdCategory = await res.json();
        setNewCategoryName('');
        if (autoSelectAsParent && !newCategoryParentId) {
          setNewCategoryParentId(createdCategory.id);
        } else {
          setNewCategoryParentId('');
        }
        fetchCategories();
      }
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  // Create subcategory
  const handleCreateSubcategory = async (parentId: string) => {
    if (!newSubcategoryName.trim()) return;

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSubcategoryName.trim(), parentId }),
      });
      if (res.ok) {
        setNewSubcategoryName('');
        setSelectedParentId(null);
        fetchCategories();
      }
    } catch (error) {
      console.error('Failed to create subcategory:', error);
    }
  };

  // Update category
  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingName.trim()) return;

    try {
      const res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName.trim() }),
      });
      if (res.ok) {
        setEditingCategory(null);
        setEditingName('');
        fetchCategories();
      }
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  // Delete category
  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`"${name}" 카테고리를 삭제하시겠습니까? 하위 카테고리도 함께 삭제됩니다.`)) return;

    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCategories();
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  // Update category section
  const handleUpdateCategorySection = async (categoryId: string, sectionId: string | null) => {
    try {
      const res = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId }),
      });
      if (res.ok) {
        fetchCategories();
        fetchSections();
      }
    } catch (error) {
      console.error('Failed to update category section:', error);
    }
  };

  // Create new section
  const handleCreateSection = async () => {
    if (!newSectionTitle.trim()) return;

    try {
      const res = await fetch('/api/admin/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newSectionTitle.trim(),
          description: newSectionDescription.trim() || null,
        }),
      });
      if (res.ok) {
        setNewSectionTitle('');
        setNewSectionDescription('');
        fetchSections();
      }
    } catch (error) {
      console.error('Failed to create section:', error);
    }
  };

  // Update section
  const handleUpdateSection = async () => {
    if (!editingSection || !editingSectionTitle.trim()) return;

    try {
      const res = await fetch(`/api/admin/sections/${editingSection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingSectionTitle.trim(),
          description: editingSectionDescription.trim() || null,
        }),
      });
      if (res.ok) {
        setEditingSection(null);
        setEditingSectionTitle('');
        setEditingSectionDescription('');
        fetchSections();
      }
    } catch (error) {
      console.error('Failed to update section:', error);
    }
  };

  // Delete section
  const handleDeleteSection = async (id: string, title: string) => {
    if (!confirm(`"${title}" 섹션을 삭제하시겠습니까? 카테고리는 삭제되지 않고 섹션 연결만 해제됩니다.`)) return;

    try {
      const res = await fetch(`/api/admin/sections/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSections();
        fetchCategories();
      }
    } catch (error) {
      console.error('Failed to delete section:', error);
    }
  };

  // Fetch templates from database
  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Load template
  const loadTemplate = (template: PostTemplate) => {
    const categoryParsed = parseCategory(template.category || '');
    setSelectedParentCategory(categoryParsed.parent);
    setSelectedSubCategory(categoryParsed.sub);
    setFormData(prev => ({
      ...prev,
      category: template.category || '',
      tags: template.tags.join(', '),
      content: template.content,
    }));
    setShowTemplateModal(false);
  };

  // Save as template
  const saveAsTemplate = async () => {
    if (!newTemplateName.trim()) return;

    try {
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTemplateName.trim(),
          description: newTemplateDescription.trim() || null,
          category: formData.category,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
          content: formData.content,
        }),
      });

      if (res.ok) {
        setNewTemplateName('');
        setNewTemplateDescription('');
        setShowSaveTemplateModal(false);
        fetchTemplates();
        alert('템플릿이 저장되었습니다.');
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('템플릿 저장에 실패했습니다.');
    }
  };

  // Delete template
  const deleteTemplate = async (id: string, name: string) => {
    if (!confirm(`"${name}" 템플릿을 삭제하시겠습니까?`)) return;

    try {
      const res = await fetch(`/api/admin/templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTemplates();
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };


  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    const newText =
      formData.content.substring(0, start) +
      before +
      selectedText +
      after +
      formData.content.substring(end);

    setFormData({ ...formData, content: newText });

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const insertAtLineStart = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const content = formData.content;

    // Find the start of the current line
    let lineStart = start;
    while (lineStart > 0 && content[lineStart - 1] !== '\n') {
      lineStart--;
    }

    const newText = content.substring(0, lineStart) + prefix + content.substring(lineStart);
    setFormData({ ...formData, content: newText });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  const insertMarkdown = (markdown: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setFormData({ ...formData, content: formData.content + markdown });
      return;
    }

    const start = textarea.selectionStart;
    const newContent =
      formData.content.substring(0, start) +
      markdown +
      formData.content.substring(start);

    setFormData({ ...formData, content: newContent });

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + markdown.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // File upload function (images and PDFs)
  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();

      // Generate appropriate markdown based on file type
      let markdown: string;
      if (file.type === 'application/pdf') {
        // PDF: create a link
        markdown = `[📄 ${file.name}](${data.url})`;
      } else {
        // Image: create image embed
        markdown = `![${file.name}](${data.url})`;
      }

      insertMarkdown(markdown);
    } catch (error) {
      alert(error instanceof Error ? error.message : '파일 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  // Handle image input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle PDF input change
  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
    // Reset input
    if (pdfInputRef.current) {
      pdfInputRef.current.value = '';
    }
  };

  // Handle paste (for clipboard images)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          uploadFile(file);
        }
        break;
      }
    }
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle drop (images and PDFs)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      uploadFile(file);
    }
  };

  const toolbarButtons: ToolbarButton[] = [
    {
      icon: <span className="font-bold">B</span>,
      label: '굵게',
      action: () => insertText('**', '**'),
    },
    {
      icon: <span className="italic">I</span>,
      label: '기울임',
      action: () => insertText('*', '*'),
    },
    {
      icon: <span className="line-through">S</span>,
      label: '취소선',
      action: () => insertText('~~', '~~'),
    },
    {
      icon: <span className="text-sm font-semibold">H1</span>,
      label: 'H1',
      action: () => insertAtLineStart('# '),
    },
    {
      icon: <span className="text-sm font-semibold">H2</span>,
      label: '제목 2',
      action: () => insertAtLineStart('## '),
    },
    {
      icon: <span className="text-xs font-semibold">H3</span>,
      label: '제목 3',
      action: () => insertAtLineStart('### '),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
      label: '목록',
      action: () => insertAtLineStart('- '),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20h14M7 4h14M3 8l4 4-4 4" />
        </svg>
      ),
      label: '번호 목록',
      action: () => insertAtLineStart('1. '),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      label: '인라인 코드',
      action: () => insertText('`', '`'),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      label: '코드 블록',
      action: () => insertText('\n```\n', '\n```\n'),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      label: '링크',
      action: () => insertText('[', '](url)'),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      label: '이미지 업로드',
      action: () => fileInputRef.current?.click(),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      label: '인용',
      action: () => insertAtLineStart('> '),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      ),
      label: '구분선',
      action: () => insertText('\n---\n', ''),
    },
  ];

  const specialButtons = [
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M3 6h18M3 18h18M9 6v12M15 6v12" />
        </svg>
      ),
      label: '테이블',
      action: () => setShowTableEditor(true),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      ),
      label: '목차',
      action: () => insertMarkdown('\n## 목차\n\n- [섹션 1](#섹션-1)\n- [섹션 2](#섹션-2)\n- [섹션 3](#섹션-3)\n\n'),
    },
    {
      icon: <span className="text-sm font-mono">∑</span>,
      label: '수학 공식',
      action: () => setShowMathEditor(true),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
      ),
      label: '버튼',
      action: () => setShowButtonEditor(true),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      ),
      label: '토글',
      action: () => insertMarkdown('\n<details>\n<summary>토글 제목</summary>\n\n토글 내용\n\n</details>\n'),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      ),
      label: '열 나누기',
      action: () => setShowColumnEditor(true),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      label: '코드 블록 (고급)',
      action: () => setShowCodeLanguageDropdown(!showCodeLanguageDropdown),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: '체크박스',
      action: () => insertAtLineStart('- [ ] '),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      label: '비공개',
      action: () => insertMarkdown('\n:::private\n이 내용은 로그인한 사용자만 볼 수 있습니다.\n:::\n'),
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      label: 'PDF 업로드',
      action: () => pdfInputRef.current?.click(),
    },
    {
      icon: <span className="text-sm">😀</span>,
      label: '이모지',
      action: () => setShowEmojiPicker(true),
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const tagsArray = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      const payload = {
        ...formData,
        tags: tagsArray,
      };

      const url = isEdit ? `/api/posts/${formData.slug}` : '/api/posts';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push('/admin/posts');
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Template and Management Buttons */}
      <div className="flex flex-wrap gap-2">
        {!isEdit && (
          <>
            <button
              type="button"
              onClick={() => setShowTemplateModal(true)}
              className="px-4 py-2 text-sm bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              템플릿 불러오기
            </button>
            <button
              type="button"
              onClick={() => setShowSaveTemplateModal(true)}
              className="px-4 py-2 text-sm bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              템플릿으로 저장
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => setShowSectionModal(true)}
          className="px-4 py-2 text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          섹션 관리
        </button>
        <button
          type="button"
          onClick={() => setShowCategoryModal(true)}
          className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
          </svg>
          카테고리 관리
        </button>
      </div>

      {/* Meta Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            슬러그 (URL)
          </label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="my-awesome-post"
            required
            disabled={isEdit}
          />
        </div>

        {/* Category - Two-step selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            카테고리
          </label>
          <div className="flex gap-2">
            {/* Parent Category */}
            <select
              value={selectedParentCategory}
              onChange={(e) => {
                setSelectedParentCategory(e.target.value);
                setSelectedSubCategory(''); // Reset subcategory when parent changes
              }}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">상위 카테고리</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Subcategory - only show if parent has children */}
            {selectedParentCategory && getSubcategories().length > 0 && (
              <select
                value={selectedSubCategory}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">하위 카테고리 (선택)</option>
                {getSubcategories().map((sub) => (
                  <option key={sub.id} value={sub.name}>
                    {sub.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          {/* Show selected category path */}
          {formData.category && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              선택됨: {formData.category}
            </p>
          )}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          제목
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="포스트 제목"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          설명
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="포스트 설명"
        />
      </div>

      {/* Thumbnail/Banner Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          배너 이미지
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={formData.thumbnail}
            onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="이미지 URL 또는 파일 업로드"
          />
          <label className="px-4 py-2 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors cursor-pointer flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            업로드
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                try {
                  const formDataUpload = new FormData();
                  formDataUpload.append('file', file);
                  const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formDataUpload,
                  });
                  if (response.ok) {
                    const data = await response.json();
                    setFormData(prev => ({ ...prev, thumbnail: data.url }));
                  }
                } catch (error) {
                  alert('이미지 업로드에 실패했습니다.');
                } finally {
                  setUploading(false);
                  e.target.value = '';
                }
              }}
            />
          </label>
          {formData.thumbnail && (
            <button
              type="button"
              onClick={() => setFormData({ ...formData, thumbnail: '', thumbnailPosition: 50, thumbnailScale: 100 })}
              className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              삭제
            </button>
          )}
        </div>
        {formData.thumbnail && (
          <div className="mt-3 space-y-3">
            {/* Banner preview - matches blog display height (h-80 = 320px) */}
            <div
              className="relative h-80 rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700"
              style={{
                backgroundImage: `url(${formData.thumbnail})`,
                backgroundSize: `${formData.thumbnailScale || 100}%`,
                backgroundPosition: `center ${formData.thumbnailPosition}%`,
                backgroundRepeat: 'no-repeat',
              }}
            >
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                실제 블로그 미리보기 (320px)
              </div>
            </div>
            {/* Position adjustment */}
            <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">위치</span>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, thumbnailPosition: Math.max(0, formData.thumbnailPosition - 10) })}
                className="p-1.5 bg-white dark:bg-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                title="위로"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.thumbnailPosition}
                onChange={(e) => setFormData({ ...formData, thumbnailPosition: Number(e.target.value) })}
                className="flex-1 h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, thumbnailPosition: Math.min(100, formData.thumbnailPosition + 10) })}
                className="p-1.5 bg-white dark:bg-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                title="아래로"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, thumbnailPosition: 50 })}
                className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                중앙
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">{formData.thumbnailPosition}%</span>
            </div>
            {/* Scale adjustment */}
            <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">배율</span>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, thumbnailScale: Math.max(50, (formData.thumbnailScale || 100) - 10) })}
                className="p-1.5 bg-white dark:bg-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                title="축소"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <input
                type="range"
                min="50"
                max="200"
                value={formData.thumbnailScale || 100}
                onChange={(e) => setFormData({ ...formData, thumbnailScale: Number(e.target.value) })}
                className="flex-1 h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, thumbnailScale: Math.min(200, (formData.thumbnailScale || 100) + 10) })}
                className="p-1.5 bg-white dark:bg-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                title="확대"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, thumbnailScale: 100 })}
                className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                100%
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right">{formData.thumbnailScale || 100}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Tags & Date & Public */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            태그 (쉼표로 구분)
          </label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="React, Next.js, TypeScript"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            날짜
          </label>
          <input
            type="date"
            value={formData.date || getLocalDateStr()}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Public Toggle */}
        <div className="flex items-center pt-8">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">공개</span>
          </label>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setActiveTab('edit')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'edit'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          편집
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'preview'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          미리보기
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('split')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'split'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          분할 보기
        </button>
      </div>

      {/* Content Editor & Preview */}
      <div
        className={`${
          activeTab === 'split' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : ''
        }`}
      >
        {/* Editor */}
        {(activeTab === 'edit' || activeTab === 'split') && (
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              내용 (Markdown)
            </label>

            {/* Toolbar */}
            <div className="bg-gray-100 dark:bg-gray-700 border border-b-0 border-gray-300 dark:border-gray-600 rounded-t-lg">
              {/* Basic formatting buttons */}
              <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 dark:border-gray-600">
                {toolbarButtons.map((button, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => button.action(textareaRef.current!, formData.content, (c) => setFormData({ ...formData, content: c }))}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    title={button.label}
                  >
                    {button.icon}
                  </button>
                ))}
              </div>
              {/* Special block buttons with labels */}
              <div className="flex flex-wrap gap-1 p-2 relative">
                {specialButtons.map((button, index) => (
                  <button
                    key={`special-${index}`}
                    type="button"
                    onClick={button.action}
                    className="px-2 py-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors flex items-center gap-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    title={button.label}
                  >
                    {button.icon}
                    <span>{button.label}</span>
                  </button>
                ))}

                {/* Code Language Dropdown */}
                {showCodeLanguageDropdown && (
                  <div className="absolute z-20 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-2 grid grid-cols-4 gap-1 w-80">
                    {codeLanguages.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => {
                          insertMarkdown(`\n\`\`\`${lang}\n\n\`\`\`\n`);
                          setShowCodeLanguageDropdown(false);
                        }}
                        className="px-2 py-1 text-xs text-gray-700 dark:text-gray-300 hover:bg-violet-100 dark:hover:bg-violet-900/30 rounded transition-colors text-left"
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Hidden file input for image upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Hidden file input for PDF upload */}
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              onChange={handlePdfChange}
              className="hidden"
            />

            {/* Upload indicator */}
            {uploading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-gray-700/80 flex items-center justify-center z-10 rounded-b-lg">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-sm font-medium">이미지 업로드 중...</span>
                </div>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              onPaste={handlePaste}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="w-full h-[600px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-b-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
              placeholder="# 포스트 내용을 작성하세요... (이미지를 붙여넣거나 드래그앤드롭하세요)"
            />
          </div>
        )}

        {/* Preview */}
        {(activeTab === 'preview' || activeTab === 'split') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              미리보기
            </label>
            <div className="h-[740px] border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 overflow-y-auto">
              {formData.content || formData.title ? (
                <div className="text-gray-900 dark:text-gray-100">
                  {/* Banner Image Preview */}
                  {formData.thumbnail && (
                    <div className="mb-6 rounded-t-lg overflow-hidden">
                      <div
                        className="w-full h-48 bg-gray-200 dark:bg-gray-700"
                        style={{
                          backgroundImage: `url(${formData.thumbnail})`,
                          backgroundSize: `${formData.thumbnailScale || 100}%`,
                          backgroundPosition: `center ${formData.thumbnailPosition}%`,
                          backgroundRepeat: 'no-repeat',
                        }}
                      />
                    </div>
                  )}
                  <div className="p-6">
                  {/* Post Header Preview */}
                  <header className="mb-6 pb-6 border-b-2 border-violet-400 dark:border-violet-500">
                    {formData.category && (
                      <div className="flex items-center text-sm mb-3 text-gray-600 dark:text-gray-400">
                        <span>Blog</span>
                        <span className="mx-2">/</span>
                        <span className="text-violet-600 dark:text-violet-400">{formData.category}</span>
                      </div>
                    )}
                    {formData.title && (
                      <h1 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900 dark:text-white">
                        {formData.title}
                      </h1>
                    )}
                    {formData.description && (
                      <p className="text-base mb-4 text-gray-700 dark:text-gray-300">
                        {formData.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <time>{formData.date || new Date().toLocaleDateString('ko-KR')}</time>
                      {formData.tags && (
                        <div className="flex flex-wrap gap-2">
                          {formData.tags.split(',').filter(Boolean).map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            >
                              #{tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </header>
                  {/* Content Preview */}
                  <MDXContent content={formData.content} />
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 text-center mt-20">
                  내용을 입력하면 미리보기가 표시됩니다.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? '저장 중...' : isEdit ? '수정하기' : '작성하기'}
        </button>
      </div>

      {/* Table Editor Modal */}
      <TableEditor
        isOpen={showTableEditor}
        onClose={() => setShowTableEditor(false)}
        onInsert={insertMarkdown}
      />

      {/* Code Block Editor Modal */}
      <CodeBlockEditor
        isOpen={showCodeBlockEditor}
        onClose={() => setShowCodeBlockEditor(false)}
        onInsert={insertMarkdown}
      />

      {/* Column Editor Modal */}
      <ColumnEditor
        isOpen={showColumnEditor}
        onClose={() => setShowColumnEditor(false)}
        onInsert={insertMarkdown}
      />

      {/* Math Editor Modal */}
      <MathEditor
        isOpen={showMathEditor}
        onClose={() => setShowMathEditor(false)}
        onInsert={insertMarkdown}
      />

      {/* Button Editor Modal */}
      <ButtonEditor
        isOpen={showButtonEditor}
        onClose={() => setShowButtonEditor(false)}
        onInsert={insertMarkdown}
      />

      {/* Emoji Picker Modal */}
      {showEmojiPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                이모지 선택
              </h3>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Category tabs */}
            <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-600 px-2 pt-2 gap-1">
              {Object.keys(emojiCategories).map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedEmojiCategory(category)}
                  className={`px-3 py-1.5 text-xs whitespace-nowrap rounded-t transition-colors ${
                    selectedEmojiCategory === category
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            {/* Emoji grid */}
            <div className="p-4 max-h-64 overflow-y-auto">
              <div className="grid grid-cols-10 gap-1">
                {emojiCategories[selectedEmojiCategory as keyof typeof emojiCategories]?.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      insertMarkdown(emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="w-8 h-8 flex items-center justify-center text-xl rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(false)}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                템플릿 불러오기
              </h3>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {templates.length === 0 ? (
                <p className="text-center text-gray-500 py-8">저장된 템플릿이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => loadTemplate(template)}>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {template.name}
                        </div>
                        {template.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {template.description}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {template.category && (
                            <span className="text-xs px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded">
                              {template.category}
                            </span>
                          )}
                          {template.tags.length > 0 && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {template.tags.slice(0, 3).join(', ')}
                              {template.tags.length > 3 && '...'}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteTemplate(template.id, template.name)}
                        className="ml-2 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                템플릿으로 저장
              </h3>
              <button
                type="button"
                onClick={() => setShowSaveTemplateModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  템플릿 이름 *
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="예: TIL 템플릿"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  설명 (선택)
                </label>
                <input
                  type="text"
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  placeholder="예: 오늘 배운 것 기록용"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                현재 카테고리, 태그, 내용이 템플릿으로 저장됩니다.
              </p>
            </div>
            <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowSaveTemplateModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={saveAsTemplate}
                disabled={!newTemplateName.trim()}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                카테고리 관리
              </h3>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Add new category */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  새 카테고리 추가
                </label>
                <div className="space-y-2">
                  <select
                    value={newCategorySectionId}
                    onChange={(e) => {
                      setNewCategorySectionId(e.target.value);
                      if (e.target.value) {
                        setNewCategoryParentId('');
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-indigo-200 dark:border-indigo-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  >
                    <option value="">블로그 섹션 선택 (선택 안함)</option>
                    {dbSections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.title} 섹션에 표시
                      </option>
                    ))}
                  </select>
                  <select
                    value={newCategoryParentId}
                    onChange={(e) => {
                      setNewCategoryParentId(e.target.value);
                      if (e.target.value) {
                        setNewCategorySectionId('');
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  >
                    <option value="">상위 카테고리 (없음 - 최상위)</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        └ {cat.name}의 하위 카테고리로 추가
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder={newCategoryParentId ? '하위 카테고리 이름' : '카테고리 이름'}
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory(false)}
                    />
                    <button
                      type="button"
                      onClick={() => handleCreateCategory(false)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                    >
                      {newCategoryParentId ? '하위 추가' : '추가'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Category list */}
              <div className="space-y-2">
                {categories.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">카테고리가 없습니다.</p>
                ) : (
                  categories.map((category) => (
                    <div key={category.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50">
                        <div className="flex-1 min-w-0">
                          {editingCategory?.id === category.id ? (
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-blue-300 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUpdateCategory();
                                if (e.key === 'Escape') {
                                  setEditingCategory(null);
                                  setEditingName('');
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {category.name}
                              </span>
                              {category.sectionId && (
                                <span className="px-1.5 py-0.5 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded">
                                  {dbSections.find(s => s.id === category.sectionId)?.title}
                                </span>
                              )}
                            </div>
                          )}
                          {editingCategory?.id !== category.id && (
                            <select
                              value={category.sectionId || ''}
                              onChange={(e) => handleUpdateCategorySection(category.id, e.target.value || null)}
                              className="mt-1 w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-700 dark:text-gray-300"
                            >
                              <option value="">섹션 미지정</option>
                              {dbSections.map((section) => (
                                <option key={section.id} value={section.id}>
                                  {section.title}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2 flex-shrink-0">
                          {editingCategory?.id === category.id ? (
                            <>
                              <button
                                type="button"
                                onClick={handleUpdateCategory}
                                className="px-2 py-1 text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                              >
                                저장
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCategory(null);
                                  setEditingName('');
                                }}
                                className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                              >
                                취소
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => setSelectedParentId(selectedParentId === category.id ? null : category.id)}
                                className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                              >
                                + 하위
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCategory(category);
                                  setEditingName(category.name);
                                }}
                                className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                              >
                                수정
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(category.id, category.name)}
                                className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                              >
                                삭제
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {selectedParentId === category.id && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newSubcategoryName}
                              onChange={(e) => setNewSubcategoryName(e.target.value)}
                              placeholder="하위 카테고리 이름"
                              className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                              onKeyDown={(e) => e.key === 'Enter' && handleCreateSubcategory(category.id)}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleCreateSubcategory(category.id)}
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                              추가
                            </button>
                          </div>
                        </div>
                      )}

                      {category.children.length > 0 && (
                        <div className="border-t border-gray-200 dark:border-gray-700">
                          {category.children.map((sub, index) => (
                            <div
                              key={sub.id}
                              className="flex items-center justify-between p-3 pl-6 border-b last:border-b-0 border-gray-100 dark:border-gray-700/50"
                            >
                              {editingCategory?.id === sub.id ? (
                                <div className="flex items-center flex-1">
                                  <span className="text-gray-400 dark:text-gray-500 mr-2">
                                    {index === category.children.length - 1 ? '└' : '├'}
                                  </span>
                                  <input
                                    type="text"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleUpdateCategory();
                                      if (e.key === 'Escape') {
                                        setEditingCategory(null);
                                        setEditingName('');
                                      }
                                    }}
                                    autoFocus
                                  />
                                </div>
                              ) : (
                                <span className="text-sm text-gray-900 dark:text-white flex items-center">
                                  <span className="text-gray-400 dark:text-gray-500 mr-2">
                                    {index === category.children.length - 1 ? '└' : '├'}
                                  </span>
                                  {sub.name}
                                </span>
                              )}
                              <div className="flex gap-1">
                                {editingCategory?.id === sub.id ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={handleUpdateCategory}
                                      className="px-2 py-1 text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                    >
                                      저장
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingCategory(null);
                                        setEditingName('');
                                      }}
                                      className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                    >
                                      취소
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingCategory(sub);
                                        setEditingName(sub.name);
                                      }}
                                      className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                    >
                                      수정
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCategory(sub.id, sub.name)}
                                      className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                    >
                                      삭제
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section Management Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                블로그 섹션 관리
              </h3>
              <button
                type="button"
                onClick={() => setShowSectionModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                블로그 페이지의 섹션(Web2 Security, Web3 Security, TIL 등)을 관리합니다.
              </p>

              {/* Seed default sections button */}
              {dbSections.length === 0 && (
                <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-3">
                    아직 섹션이 없습니다. 기본 섹션을 생성하시겠습니까?
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/admin/sections/seed', { method: 'POST' });
                        if (res.ok) {
                          fetchSections();
                        }
                      } catch (error) {
                        console.error('Failed to seed sections:', error);
                      }
                    }}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    기본 섹션 생성 (Web2, Web3, TIL)
                  </button>
                </div>
              )}

              {/* Add new section */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  새 섹션 추가
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    placeholder="섹션 제목 (예: Web2 Security)"
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateSection()}
                  />
                  <input
                    type="text"
                    value={newSectionDescription}
                    onChange={(e) => setNewSectionDescription(e.target.value)}
                    placeholder="섹션 설명 (선택)"
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleCreateSection}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                  >
                    섹션 추가
                  </button>
                </div>
              </div>

              {/* Section list */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  현재 섹션 목록
                </h4>
                {dbSections.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">섹션이 없습니다.</p>
                ) : (
                  dbSections.map((section) => (
                    <div key={section.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      {editingSection?.id === section.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editingSectionTitle}
                            onChange={(e) => setEditingSectionTitle(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-indigo-300 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                            placeholder="섹션 제목"
                            autoFocus
                          />
                          <input
                            type="text"
                            value={editingSectionDescription}
                            onChange={(e) => setEditingSectionDescription(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-indigo-300 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                            placeholder="섹션 설명 (선택)"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleUpdateSection}
                              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              저장
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSection(null);
                                setEditingSectionTitle('');
                                setEditingSectionDescription('');
                              }}
                              className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-white">
                              {section.title}
                            </h5>
                            {section.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {section.description}
                              </p>
                            )}
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                              {section.categories?.length || 0}개의 카테고리
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSection(section);
                                setEditingSectionTitle(section.title);
                                setEditingSectionDescription(section.description || '');
                              }}
                              className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSection(section.id, section.title)}
                              className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowSectionModal(false)}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
