"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { cn } from "@/libs/utils";
import { uploadToCloudinary, validateImageFile } from "@/libs/cloudinary";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

// Custom FontSize extension
const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.fontSize?.replace(/['"]+/g, ""),
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.fontSize) {
            return {};
          }
          return {
            style: `font-size: ${attributes.fontSize}`,
          };
        },
      },
    };
  },
});

// Custom CSS for TipTap editor content
const editorStyles = `
  .tiptap-editor h1 {
    font-size: 2.25rem;
    font-weight: 700;
    line-height: 1.2;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
  }
  .tiptap-editor h2 {
    font-size: 1.875rem;
    font-weight: 700;
    line-height: 1.25;
    margin-top: 1.25rem;
    margin-bottom: 0.625rem;
  }
  .tiptap-editor h3 {
    font-size: 1.5rem;
    font-weight: 600;
    line-height: 1.3;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
  }
  .tiptap-editor h4 {
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.35;
    margin-top: 0.875rem;
    margin-bottom: 0.5rem;
  }
  .tiptap-editor h5 {
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 1.4;
    margin-top: 0.75rem;
    margin-bottom: 0.375rem;
  }
  .tiptap-editor h6 {
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.4;
    margin-top: 0.75rem;
    margin-bottom: 0.375rem;
  }
  .tiptap-editor p {
    margin-bottom: 0.75rem;
    line-height: 1.625;
  }
  .tiptap-editor ul {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin-bottom: 0.75rem;
  }
  .tiptap-editor ol {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin-bottom: 0.75rem;
  }
  .tiptap-editor li {
    margin-bottom: 0.25rem;
    line-height: 1.5;
  }
  .tiptap-editor li p {
    margin-bottom: 0;
  }
  .tiptap-editor blockquote {
    border-left: 4px solid #a0ac67;
    padding-left: 1rem;
    margin-left: 0;
    margin-right: 0;
    margin-bottom: 0.75rem;
    font-style: italic;
    color: #555;
  }
  .tiptap-editor pre {
    background-color: #1e1e1e;
    color: #d4d4d4;
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin-bottom: 0.75rem;
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
  }
  .tiptap-editor code {
    background-color: #f3f3f3;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-family: 'Courier New', monospace;
    font-size: 0.875em;
  }
  .tiptap-editor pre code {
    background-color: transparent;
    padding: 0;
    border-radius: 0;
  }
  .tiptap-editor a {
    color: #a0ac67;
    text-decoration: underline;
  }
  .tiptap-editor a:hover {
    color: #8a9657;
  }
  .tiptap-editor img {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    margin: 1rem 0;
  }
  .tiptap-editor hr {
    border: none;
    border-top: 1px solid #e5e5e5;
    margin: 1.5rem 0;
  }
  .tiptap-editor mark {
    background-color: #fef08a;
    padding: 0 0.125rem;
    border-radius: 0.125rem;
  }
  .tiptap-editor strong {
    font-weight: 700;
  }
  .tiptap-editor em {
    font-style: italic;
  }
  .tiptap-editor u {
    text-decoration: underline;
  }
  .tiptap-editor s {
    text-decoration: line-through;
  }
  .tiptap-editor .ProseMirror {
    outline: none;
    min-height: 300px;
    padding: 1rem;
  }
  .tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
    color: #adb5bd;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }
`;

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  className,
  placeholder = "Write your content here...",
}) => {
  const [activeTab, setActiveTab] = useState<"visual" | "text">("visual");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  const [showBlockTypePicker, setShowBlockTypePicker] = useState(false);
  const [rawHtml, setRawHtml] = useState(value);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
        setShowFontSizePicker(false);
        setShowBlockTypePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-moss-stone underline",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg my-4",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount,
      TextStyle,
      Color,
      FontSize,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      setRawHtml(html);
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-[300px] px-4 py-3",
      },
    },
  });

  // Update editor content when value prop changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
      setRawHtml(value);
    }
  }, [value, editor]);

  // Calculate word count and reading time
  const wordCount = editor?.storage.characterCount?.words() || 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Get last edited info
  const lastEdited = editor ? "Current session" : "-";

  // Handle tab switch
  const handleTabSwitch = (tab: "visual" | "text") => {
    if (tab === "text") {
      setRawHtml(editor?.getHTML() || "");
    } else if (editor && rawHtml !== editor.getHTML()) {
      editor.commands.setContent(rawHtml);
    }
    setActiveTab(tab);
  };

  // Handle raw HTML change
  const handleRawHtmlChange = (html: string) => {
    setRawHtml(html);
    onChange(html);
  };

  // Add image handler
  const addImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle image upload to Cloudinary
  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !editor) return;

      // Validate file first
      const validation = validateImageFile(file, 10); // Max 10MB for article images
      if (!validation.valid) {
        alert(validation.error || "Invalid file");
        return;
      }

      setIsUploadingImage(true);

      try {
        // Upload to Cloudinary
        const result = await uploadToCloudinary(file, {
          folder: "bumi-resource/articles",
          resourceType: "image",
          tags: ["article", "content"],
        });

        // Insert image with Cloudinary URL
        editor.chain().focus().setImage({ src: result.secure_url }).run();
      } catch (error) {
        console.error("Image upload error:", error);
        alert("Failed to upload image. Please try again.");
      } finally {
        setIsUploadingImage(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [editor]
  );

  // Add link handler
  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  // Font sizes
  const fontSizes = ["12", "14", "16", "18", "20", "24", "28", "32"];

  // Colors
  const colors = [
    "#000000",
    "#434343",
    "#666666",
    "#999999",
    "#B7B7B7",
    "#CCCCCC",
    "#D9D9D9",
    "#EFEFEF",
    "#F3F3F3",
    "#FFFFFF",
    "#980000",
    "#FF0000",
    "#FF9900",
    "#FFFF00",
    "#00FF00",
    "#00FFFF",
    "#4A86E8",
    "#0000FF",
    "#9900FF",
    "#FF00FF",
  ];

  if (!editor) {
    return (
      <div className="border border-grey-stroke rounded-xl overflow-hidden bg-white p-4">
        <div className="animate-pulse">
          <div className="h-10 bg-grey-lightest rounded mb-4"></div>
          <div className="h-64 bg-grey-lightest rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border border-grey-stroke rounded-xl overflow-hidden bg-white",
        className
      )}
    >
      {/* Add Media Button + Visual/Text Tabs */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-grey-stroke bg-white">
        <button
          type="button"
          onClick={addImage}
          disabled={isUploadingImage}
          className={cn(
            "flex items-center gap-2 text-sm text-neutral-03 hover:text-moss-stone transition-colors border border-grey-stroke rounded-md p-2",
            isUploadingImage && "opacity-50 cursor-not-allowed"
          )}
        >
          {isUploadingImage ? (
            <>
              <svg
                className="animate-spin"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </svg>
              <span className="font-medium">Uploading...</span>
            </>
          ) : (
            <>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21,15 16,10 5,21" />
              </svg>
              <span className="font-medium">Add Media</span>
            </>
          )}
        </button>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => handleTabSwitch("visual")}
            className={cn(
              "text-sm font-medium transition-colors",
              activeTab === "visual" ? "text-moss-stone" : "text-grey"
            )}
          >
            Visual
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch("text")}
            className={cn(
              "text-sm font-medium transition-colors",
              activeTab === "text" ? "text-moss-stone" : "text-grey"
            )}
          >
            Text
          </button>
        </div>
      </div>

      {/* Toolbar */}
      {activeTab === "visual" && (
        <div ref={dropdownRef} className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-grey-stroke bg-grey-lightest">
          {/* Block Type Dropdown (Paragraph + H1-H6 + Blockquote + Code Block) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowBlockTypePicker(!showBlockTypePicker)}
              className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-neutral-03 hover:bg-white rounded transition-colors"
            >
              <span>
                {editor.isActive("heading", { level: 1 })
                  ? "Heading 1"
                  : editor.isActive("heading", { level: 2 })
                  ? "Heading 2"
                  : editor.isActive("heading", { level: 3 })
                  ? "Heading 3"
                  : editor.isActive("heading", { level: 4 })
                  ? "Heading 4"
                  : editor.isActive("heading", { level: 5 })
                  ? "Heading 5"
                  : editor.isActive("heading", { level: 6 })
                  ? "Heading 6"
                  : editor.isActive("blockquote")
                  ? "Blockquote"
                  : editor.isActive("codeBlock")
                  ? "Code Block"
                  : "Paragraph"}
              </span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </button>
            {showBlockTypePicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-grey-stroke rounded-lg shadow-lg z-20 min-w-[140px]">
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().setParagraph().run();
                    setShowBlockTypePicker(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm hover:bg-grey-lightest transition-colors",
                    editor.isActive("paragraph") && !editor.isActive("blockquote") && !editor.isActive("codeBlock") ? "bg-grey-lightest font-medium" : ""
                  )}
                >
                  Paragraph
                </button>
                <div className="h-px bg-grey-stroke mx-2" />
                {[1, 2, 3, 4, 5, 6].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => {
                      editor
                        .chain()
                        .focus()
                        .toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 })
                        .run();
                      setShowBlockTypePicker(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 hover:bg-grey-lightest transition-colors",
                      editor.isActive("heading", { level })
                        ? "bg-grey-lightest font-medium"
                        : "",
                      level === 1 ? "text-2xl font-bold" : "",
                      level === 2 ? "text-xl font-bold" : "",
                      level === 3 ? "text-lg font-semibold" : "",
                      level === 4 ? "text-base font-semibold" : "",
                      level === 5 ? "text-sm font-semibold" : "",
                      level === 6 ? "text-xs font-semibold" : ""
                    )}
                  >
                    Heading {level}
                  </button>
                ))}
                <div className="h-px bg-grey-stroke mx-2" />
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().toggleBlockquote().run();
                    setShowBlockTypePicker(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm hover:bg-grey-lightest transition-colors italic",
                    editor.isActive("blockquote") ? "bg-grey-lightest font-medium" : ""
                  )}
                >
                  Blockquote
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().toggleCodeBlock().run();
                    setShowBlockTypePicker(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm hover:bg-grey-lightest transition-colors font-mono",
                    editor.isActive("codeBlock") ? "bg-grey-lightest font-medium" : ""
                  )}
                >
                  Code Block
                </button>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-grey-stroke mx-1" />

          {/* Text Color */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className={cn(
                "p-1.5 rounded hover:bg-white transition-colors",
                showColorPicker ? "bg-white" : ""
              )}
              title="Text Color"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 20h16" />
                <path d="M9.5 4L4 16" />
                <path d="M14.5 4L20 16" />
                <path d="M7 12h10" />
              </svg>
            </button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-grey-stroke rounded-lg shadow-lg z-20 p-2 w-48">
                <div className="grid grid-cols-10 gap-1">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        editor.chain().focus().setColor(color).run();
                        setShowColorPicker(false);
                      }}
                      className="w-4 h-4 rounded border border-grey-stroke hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Highlight */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={cn(
              "p-1.5 rounded hover:bg-white transition-colors",
              editor.isActive("highlight") ? "bg-white text-moss-stone" : ""
            )}
            title="Highlight"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 11l-6 6v3h9l3-3" />
              <path d="M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
            </svg>
          </button>

          <div className="w-px h-6 bg-grey-stroke mx-1" />

          {/* Bold */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              "p-1.5 rounded hover:bg-white transition-colors font-bold text-sm",
              editor.isActive("bold") ? "bg-white text-moss-stone" : ""
            )}
            title="Bold"
          >
            B
          </button>

          {/* Italic */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              "p-1.5 rounded hover:bg-white transition-colors italic text-sm",
              editor.isActive("italic") ? "bg-white text-moss-stone" : ""
            )}
            title="Italic"
          >
            I
          </button>

          {/* Underline */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn(
              "p-1.5 rounded hover:bg-white transition-colors underline text-sm",
              editor.isActive("underline") ? "bg-white text-moss-stone" : ""
            )}
            title="Underline"
          >
            U
          </button>

          {/* Strikethrough */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn(
              "p-1.5 rounded hover:bg-white transition-colors line-through text-sm",
              editor.isActive("strike") ? "bg-white text-moss-stone" : ""
            )}
            title="Strikethrough"
          >
            S
          </button>

          <div className="w-px h-6 bg-grey-stroke mx-1" />

          {/* Font Size */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFontSizePicker(!showFontSizePicker)}
              className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-neutral-03 hover:bg-white rounded transition-colors"
            >
              <span>16</span>
              <svg
                width="8"
                height="8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <polyline points="18,15 12,9 6,15" />
              </svg>
              <svg
                width="8"
                height="8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </button>
            {showFontSizePicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-grey-stroke rounded-lg shadow-lg z-20">
                {fontSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      editor
                        .chain()
                        .focus()
                        .setMark("textStyle", { fontSize: `${size}px` })
                        .run();
                      setShowFontSizePicker(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-grey-lightest transition-colors"
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-grey-stroke mx-1" />

          {/* Text Align Left */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={cn(
              "p-1.5 rounded hover:bg-white transition-colors",
              editor.isActive({ textAlign: "left" })
                ? "bg-white text-moss-stone"
                : ""
            )}
            title="Align Left"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="15" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Text Align Center */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={cn(
              "p-1.5 rounded hover:bg-white transition-colors",
              editor.isActive({ textAlign: "center" })
                ? "bg-white text-moss-stone"
                : ""
            )}
            title="Align Center"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="6" y1="12" x2="18" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Text Align Right */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={cn(
              "p-1.5 rounded hover:bg-white transition-colors",
              editor.isActive({ textAlign: "right" })
                ? "bg-white text-moss-stone"
                : ""
            )}
            title="Align Right"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="9" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="w-px h-6 bg-grey-stroke mx-1" />

          {/* Ordered List */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              "p-1.5 rounded hover:bg-white transition-colors",
              editor.isActive("orderedList") ? "bg-white text-moss-stone" : ""
            )}
            title="Ordered List"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="10" y1="6" x2="21" y2="6" />
              <line x1="10" y1="12" x2="21" y2="12" />
              <line x1="10" y1="18" x2="21" y2="18" />
              <text x="4" y="8" fontSize="8" fill="currentColor">
                1
              </text>
              <text x="4" y="14" fontSize="8" fill="currentColor">
                2
              </text>
              <text x="4" y="20" fontSize="8" fill="currentColor">
                3
              </text>
            </svg>
          </button>

          {/* Bullet List */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              "p-1.5 rounded hover:bg-white transition-colors",
              editor.isActive("bulletList") ? "bg-white text-moss-stone" : ""
            )}
            title="Bullet List"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="9" y1="6" x2="21" y2="6" />
              <line x1="9" y1="12" x2="21" y2="12" />
              <line x1="9" y1="18" x2="21" y2="18" />
              <circle cx="4" cy="6" r="2" fill="currentColor" />
              <circle cx="4" cy="12" r="2" fill="currentColor" />
              <circle cx="4" cy="18" r="2" fill="currentColor" />
            </svg>
          </button>

          <div className="w-px h-6 bg-grey-stroke mx-1" />

          {/* Link */}
          <button
            type="button"
            onClick={setLink}
            className={cn(
              "p-1.5 rounded hover:bg-white transition-colors",
              editor.isActive("link") ? "bg-white text-moss-stone" : ""
            )}
            title="Add Link"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </button>

          {/* Code */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn(
              "p-1.5 rounded hover:bg-white transition-colors",
              editor.isActive("code") ? "bg-white text-moss-stone" : ""
            )}
            title="Inline Code"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="16,18 22,12 16,6" />
              <polyline points="8,6 2,12 8,18" />
            </svg>
          </button>

          {/* Image */}
          <button
            type="button"
            onClick={addImage}
            disabled={isUploadingImage}
            className={cn(
              "p-1.5 rounded hover:bg-white transition-colors",
              isUploadingImage && "opacity-50 cursor-not-allowed"
            )}
            title="Insert Image"
          >
            {isUploadingImage ? (
              <svg
                className="animate-spin"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21,15 16,10 5,21" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg,image/webp,image/gif"
        onChange={handleImageUpload}
        className="hidden"
        disabled={isUploadingImage}
      />

      {/* Editor Content */}
      <div className="bg-white min-h-[300px]">
        {activeTab === "visual" ? (
          <>
            <style dangerouslySetInnerHTML={{ __html: editorStyles }} />
            <div className="tiptap-editor">
              <EditorContent editor={editor} className="min-h-[300px]" />
            </div>
          </>
        ) : (
          <textarea
            value={rawHtml}
            onChange={(e) => handleRawHtmlChange(e.target.value)}
            placeholder="Enter HTML..."
            className="w-full min-h-[300px] px-4 py-3 text-sm font-mono resize-none outline-none thinnest-scrollbar"
          />
        )}
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-grey-stroke bg-grey-lightest text-xs text-grey">
        <div className="flex items-center gap-4">
          <span>Word Count: {wordCount}</span>
          <span>•</span>
          <span>Reading Time: {readingTime} min</span>
        </div>
        <span>Last Edited by: {lastEdited}</span>
      </div>
    </div>
  );
};
