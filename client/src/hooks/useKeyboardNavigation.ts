import { useEffect } from 'react';

export function useKeyboardNavigation(
  formRef: React.RefObject<HTMLFormElement | null>,
  onSave: () => void,
  onSaveAndNew: () => void
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save & New (Ctrl + Shift + Enter)
      if (e.ctrlKey && e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        onSaveAndNew();
        return;
      }

      // Save (Ctrl + Enter)
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        onSave();
        return;
      }

      // If we are inside an input/select and not typing in a textarea
      if (e.key === 'Enter' && e.target instanceof HTMLElement && e.target.tagName !== 'TEXTAREA' && !e.ctrlKey) {
        e.preventDefault();
        
        const form = formRef.current;
        if (!form) return;

        const focusableElements = Array.from(
          form.querySelectorAll('input:not([type="hidden"]), select, button[type="submit"], textarea')
        ) as HTMLElement[];

        const currentIndex = focusableElements.indexOf(e.target);
        
        if (currentIndex > -1) {
          let nextIndex;
          if (e.shiftKey) {
            // Previous
            nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
          } else {
            // Next
            nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
          }
          focusableElements[nextIndex].focus();
        }
      }
    };

    const formElement = formRef.current;
    if (formElement) {
      formElement.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (formElement) {
        formElement.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [formRef, onSave, onSaveAndNew]);
}
