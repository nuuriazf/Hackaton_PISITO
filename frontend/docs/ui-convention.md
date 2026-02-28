# UI Convention (Tailwind)

## Color palette
- Base palette (`brand`):
- `brand-50` `#E6F4FF`
- `brand-100` `#B8DFFF`
- `brand-200` `#7AC3FF`
- `brand-300` `#5CB6FF`
- `brand-400` `#2EA1FF`
- `brand-500` `#008CFF`
- `brand-600` `#0073D1`
- `brand-700` `#005AA3`
- `brand-800` `#004175`
- `brand-900` `#002747`
- `brand-950` `#000E1A`
- `ink-500` to `ink-900`: text scale on white surfaces.
- Base surfaces should be `white` / `brand-50` with `brand-200` borders.

## Typography
- Font family: `font-sans` (configured in `tailwind.config.cjs`).
- Title: `text-display`.
- Section title: `text-title`.
- Body: `text-body`.

## Core reusable classes
Defined in `src/components/ui/styles.ts`:
- `appShellClass` + `appCenterClass`
- `panelClass`
- `formStackClass`, `fieldLabelClass`
- `inputClass`, `textareaClass`
- `primaryButtonClass`, `ghostButtonClass`, `dangerButtonClass`
- `pageTitleClass`, `subtitleClass`, `helperTextClass`
- `errorTextClass`

## Rules for new components
1. Reuse classes from `styles.ts` before writing inline utility strings.
2. Keep default pages white/light-blue, avoiding dark backgrounds.
3. Use `primaryButtonClass` for primary actions and `ghostButtonClass` for secondary.
4. Reserve `dangerButtonClass` and red tones only for destructive actions.
