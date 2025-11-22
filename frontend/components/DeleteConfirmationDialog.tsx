"use client"

import { useState, cloneElement, isValidElement } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../components/ui/dialog"
import { Button } from "../components/ui/button"
import { Trash } from 'lucide-react'
import { toast } from "sonner"

interface DeleteConfirmationDialogProps {
    // The name of the item to be deleted
    itemName: string

    // The type of item (e.g., "space", "document", "folder")
    itemType: string

    // Custom description text (optional)
    description?: string

    // Function to call when deletion is confirmed
    onConfirm: () => Promise<void>

    // Optional callback for when deletion is successful
    onSuccess?: () => void

    // Optional callback for when deletion fails
    onError?: (error: unknown) => void

    // Optional custom trigger element
    trigger?: React.ReactNode

    // Optional variant for the trigger button
    triggerVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"

    // Optional size for the trigger button
    triggerSize?: "default" | "sm" | "lg" | "icon"

    // Optional class name for the trigger button
    triggerClassName?: string
}

export function DeleteConfirmationDialog({
    itemName,
    itemType,
    description,
    onConfirm,
    onSuccess,
    onError,
    trigger,
    triggerVariant = "ghost",
    triggerSize = "icon",
    triggerClassName,
}: DeleteConfirmationDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const defaultDescription = `This will permanently delete the ${itemType.toLowerCase()} "${itemName}". This action cannot be undone.`

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        setIsDeleting(true)

        try {
            await onConfirm()
            setIsOpen(false)
            onSuccess?.()
            toast.success(`${itemType} deleted`)
        } catch (error) {
            console.error(`Error deleting ${itemType}:`, error)
            toast.error(`Failed to delete ${itemType}`, {
                description: `An error occurred while deleting the ${itemType.toLowerCase()} "${itemName}". Please try again.`,
            })
            onError?.(error)
        } finally {
            setIsDeleting(false)
        }
    }

    const handleOpenChange = (open: boolean) => {
        if (!isDeleting) {
            setIsOpen(open)
        }
    }

    const handleTriggerClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsOpen(true)
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger ? (
                    isValidElement(trigger) ? cloneElement(trigger as React.ReactElement<any>, {
                        onClick: (e: React.MouseEvent) => {
                            handleTriggerClick(e)
                            if ((trigger as React.ReactElement<any>).props.onClick) {
                                (trigger as React.ReactElement<any>).props.onClick(e)
                            }
                        }
                    }) : trigger
                ) : (
                    <Button
                        variant={triggerVariant}
                        size={triggerSize}
                        className={triggerClassName}
                        onClick={handleTriggerClick}
                    >
                        {triggerSize !== "icon" && <span>Delete</span>}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent
                className="sm:max-w-[425px]"
                onPointerDownOutside={(e) => e.preventDefault()}
                onClick={(e) => e.stopPropagation()}
            >
                <DialogHeader>
                    <DialogTitle>Delete {itemType}</DialogTitle>
                    <DialogDescription>
                        {description || defaultDescription}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setIsOpen(false)
                        }}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}