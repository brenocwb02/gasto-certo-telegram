import * as React from "react"
import { X, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

interface TagInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  limit?: number
}

const TagInput = React.forwardRef<HTMLInputElement, TagInputProps>(
  ({ className, value, onChange, placeholder, limit = 10, ...props }, ref) => {
    const [inputValue, setInputValue] = React.useState("")
    const inputRef = React.useRef<HTMLInputElement>(null)
    const { toast: showToast } = toast();

    const addTag = (tag: string) => {
      const lowerCaseTag = tag.toLowerCase().trim();
      if (!lowerCaseTag) return;
      
      if (value.length >= limit) {
        showToast({
            title: "Limite de tags atingido",
            description: `Você pode adicionar no máximo ${limit} palavras-chave.`,
            variant: "destructive"
        });
        setInputValue("");
        return;
      }
      
      if (!value.includes(lowerCaseTag)) {
        onChange([...value, lowerCaseTag])
      }
      setInputValue("")
    }
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        addTag(inputValue)
      }
      
      // Permite deletar tags com Backspace se o input estiver vazio
      if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
        e.preventDefault()
        removeTag(value.length - 1)
      }
    }

    const removeTag = (indexToRemove: number) => {
      onChange(value.filter((_, index) => index !== indexToRemove))
    }

    return (
      <div
        className={cn(
          "flex min-h-10 w-full flex-wrap items-center rounded-md border border-input bg-background p-2 text-sm",
          className
        )}
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex flex-wrap gap-1">
          {value.map((tag, index) => (
            <Badge key={index} variant="secondary" className="pr-1 font-normal">
              {tag}
              <button
                type="button"
                className="ml-1 shrink-0 rounded-full bg-transparent p-0.5 text-muted-foreground transition-colors hover:bg-muted-foreground/20"
                onClick={(e) => {
                  e.stopPropagation()
                  removeTag(index)
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        
        <Input
          ref={inputRef}
          type="text"
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 border-none bg-transparent px-2 py-0 text-sm shadow-none focus-visible:ring-0 disabled:cursor-auto"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          {...props}
        />
        
        {value.length < limit && inputValue.trim().length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => addTag(inputValue)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        )}
      </div>
    )
  }
)
TagInput.displayName = "TagInput"

export { TagInput }
