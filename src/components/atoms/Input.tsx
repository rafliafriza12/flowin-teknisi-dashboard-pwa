import { cn } from "@/libs/utils";

interface InputProps {
  placeholder?: string;
  className?: string;
  type?: string;
  value?: string;
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;  
}

interface TextAreaProps {
  placeholder?: string;
  className?: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  maxLength?: number;
  rows?: number;
  showCounter?: boolean;
}

export const ContentInput = (props: InputProps) => {
  return (
    <input
      type={props.type || "text"}
      className={cn(
        "w-full placeholder:text-sm border text-sm border-grey-stroke rounded-xl px-5 py-4 outline-none focus:ring-1 focus:ring-moss-stone transition-colors",
        props.className
      )}
      placeholder={props.placeholder}
      value={props.value || ""}
      onChange={props.onChange}
    />
  );
};

export const ContentTextArea = (props: TextAreaProps) => {
  const currentLength = props.value?.length || 0;
  const maxLength = props.maxLength || 1000;
  const showCounter = props.showCounter !== false;

  return (
    <div
      className={cn(
        "relative w-full flex flex-col rounded-xl border border-grey-stroke transition-colors",
        "focus-within:ring-1 focus-within:ring-moss-stone",
        props.className
      )}
    >
      <textarea
        className={cn(
          "w-full text-sm thinnest-scrollbar px-5 py-4 outline-none rounded-t-xl resize-none transition-colors",
          props.className
        )}
        placeholder={props.placeholder}
        value={props.value || ""}
        onChange={props.onChange}
        maxLength={maxLength}
        rows={props.rows || 5}
      />
      {showCounter && (
        <div className=" text-xs text-grey pointer-events-none bg-transparent rounded-b-xl w-full py-2 px-3">
          <p>{currentLength}/{maxLength}</p>
        </div>
      )}
    </div>
  );
};
