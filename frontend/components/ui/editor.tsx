'use client'

import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TiptapLink from '@tiptap/extension-link'
import { Button } from './button'
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Heading3,
    Quote,
    Code,
    Link as LinkIcon,
    Undo,
    Redo
} from 'lucide-react'
import { Separator as SeparatorPrimitive } from "@/components/ui/separator"

interface EditorProps {
    content: string
    onChange: (content: string) => void
}

export function Editor({ content, onChange }: EditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            TiptapLink.configure({
                openOnClick: true,
                linkOnPaste: true,
            })
        ],
        immediatelyRender: false,
        content,
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg max-w-none focus:outline-none min-h-[200px] p-4 border rounded-md',
            },
        },
        onUpdate({ editor }) {
            onChange(editor.getHTML())
        },
    })

    // Update editor content when content prop changes
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content, { emitUpdate: false })
        }
    }, [content, editor])

    if (!editor) {
        return null
    }

    return (
        <div className="space-y-2">
            <div className="flex gap-2 flex-wrap bg-muted p-1 rounded-md">
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={(e) => {
                            e.preventDefault()
                            editor.chain().focus().toggleHeading({ level: 1 }).run()
                        }}
                        className={editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}
                    >
                        <Heading1 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={(e) => {
                            e.preventDefault()
                            editor.chain().focus().toggleHeading({ level: 2 }).run()
                        }}
                        className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
                    >
                        <Heading2 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={(e) => {
                            e.preventDefault()
                            editor.chain().focus().toggleHeading({ level: 3 }).run()
                        }}
                        className={editor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}
                    >
                        <Heading3 className="h-4 w-4" />
                    </Button>
                </div>

                <SeparatorPrimitive orientation="vertical" className="h-6" />

                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={(e) => {
                            e.preventDefault()
                            editor.chain().focus().toggleBold().run()
                        }}
                        className={editor.isActive('bold') ? 'bg-accent' : ''}
                    >
                        <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={(e) => {
                            e.preventDefault()
                            editor.chain().focus().toggleItalic().run()
                        }}
                        className={editor.isActive('italic') ? 'bg-accent' : ''}
                    >
                        <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={(e) => {
                            e.preventDefault()
                            editor.chain().focus().toggleCode().run()
                        }}
                        className={editor.isActive('code') ? 'bg-accent' : ''}
                    >
                        <Code className="h-4 w-4" />
                    </Button>
                </div>

                <SeparatorPrimitive orientation="vertical" className="h-6" />

                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={(e) => {
                            e.preventDefault()
                            editor.chain().focus().toggleBulletList().run()
                        }}
                        className={editor.isActive('bulletList') ? 'bg-accent' : ''}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={(e) => {
                            e.preventDefault()
                            editor.chain().focus().toggleOrderedList().run()
                        }}
                        className={editor.isActive('orderedList') ? 'bg-accent' : ''}
                    >
                        <ListOrdered className="h-4 w-4" />
                    </Button>
                </div>

                <SeparatorPrimitive orientation="vertical" className="h-6" />

                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={(e) => {
                            e.preventDefault()
                            editor.chain().focus().toggleBlockquote().run()
                        }}
                        className={editor.isActive('blockquote') ? 'bg-accent' : ''}
                    >
                        <Quote className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={(e) => {
                            e.preventDefault()
                            const url = window.prompt('Enter the URL')
                            if (url) {
                                editor.chain().focus().setLink({ href: url }).run()
                            }
                        }}
                        className={editor.isActive('link') ? 'bg-accent' : ''}
                    >
                        <LinkIcon className="h-4 w-4" />
                    </Button>
                </div>

                <SeparatorPrimitive orientation="vertical" className="h-6" />

                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={(e) => {
                            e.preventDefault()
                            editor.chain().focus().undo().run()
                        }}
                    >
                        <Undo className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={(e) => {
                            e.preventDefault()
                            editor.chain().focus().redo().run()
                        }}
                    >
                        <Redo className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <EditorContent editor={editor} />
        </div>
    )
}
