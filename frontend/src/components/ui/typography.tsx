/**
 * @file frontend/src/components/ui/typography.tsx
 * @note Update README.md and Storybook docs when adjusting base classes.
 */

import * as React from 'react';

import cn from '@/lib/utils';

type IntrinsicTag = keyof Pick<
  JSX.IntrinsicElements,
  'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'blockquote' | 'code' | 'small' | 'div' | 'ul' | 'table'
>;

type TypographyFactoryConfig<TTag extends IntrinsicTag> = {
  tag: TTag;
  displayName: string;
  baseClass: string;
};

type TagElement<TTag extends IntrinsicTag> = TTag extends keyof HTMLElementTagNameMap
  ? HTMLElementTagNameMap[TTag]
  : Element;

function createTypographyComponent<TTag extends IntrinsicTag>({
  tag,
  displayName,
  baseClass,
}: TypographyFactoryConfig<TTag>) {
  type Props = React.ComponentPropsWithoutRef<TTag>;
  type Element = TagElement<TTag>;

  const Component = React.forwardRef<Element, Props>(({ className, ...props }, ref) => {
    const Comp = tag as unknown as React.ElementType;
    // @ts-expect-error - ref type mismatch with generic component pattern
    return <Comp ref={ref} className={cn(baseClass, className)} {...props} />;
  });

  Component.displayName = displayName;

  return Component;
}

const TypographyH1 = createTypographyComponent({
  tag: 'h1',
  displayName: 'TypographyH1',
  baseClass: 'scroll-m-20 font-display text-4xl font-semibold tracking-tight text-foreground text-balance sm:text-5xl',
});

const TypographyH2 = createTypographyComponent({
  tag: 'h2',
  displayName: 'TypographyH2',
  baseClass:
    'scroll-m-20 border-b border-border pb-2 font-display text-3xl font-semibold tracking-tight text-foreground first:mt-0 sm:text-4xl',
});

const TypographyH3 = createTypographyComponent({
  tag: 'h3',
  displayName: 'TypographyH3',
  baseClass: 'scroll-m-20 font-display text-2xl font-semibold tracking-tight text-foreground',
});

const TypographyH4 = createTypographyComponent({
  tag: 'h4',
  displayName: 'TypographyH4',
  baseClass: 'scroll-m-20 font-display text-xl font-semibold tracking-tight text-foreground',
});

const TypographyP = createTypographyComponent({
  tag: 'p',
  displayName: 'TypographyP',
  baseClass: 'leading-7 text-foreground [&:not(:first-child)]:mt-6',
});

const TypographyLead = createTypographyComponent({
  tag: 'p',
  displayName: 'TypographyLead',
  baseClass: 'text-lg text-muted-foreground sm:text-xl',
});

const TypographyLarge = createTypographyComponent({
  tag: 'div',
  displayName: 'TypographyLarge',
  baseClass: 'text-lg font-semibold text-foreground',
});

const TypographySmall = createTypographyComponent({
  tag: 'small',
  displayName: 'TypographySmall',
  baseClass: 'text-sm font-medium leading-none text-foreground',
});

const TypographyMuted = createTypographyComponent({
  tag: 'p',
  displayName: 'TypographyMuted',
  baseClass: 'text-sm text-muted-foreground',
});

const TypographyInlineCode = createTypographyComponent({
  tag: 'code',
  displayName: 'TypographyInlineCode',
  baseClass: 'relative rounded bg-muted px-[0.35rem] py-[0.2rem] font-mono text-sm font-semibold text-foreground',
});

const TypographyBlockquote = createTypographyComponent({
  tag: 'blockquote',
  displayName: 'TypographyBlockquote',
  baseClass: 'mt-6 border-l-2 border-border pl-6 italic text-muted-foreground',
});

const TypographyList = createTypographyComponent({
  tag: 'ul',
  displayName: 'TypographyList',
  baseClass: 'my-6 ml-6 list-disc space-y-2 text-foreground',
});

const TypographyTable = React.forwardRef<HTMLTableElement, React.ComponentPropsWithoutRef<'table'>>(
  ({ className, ...props }, ref) => (
    <table
      ref={ref}
      className={cn(
        'w-full caption-bottom text-sm leading-6 text-foreground [&>thead>tr]:border-b [&>tbody>tr]:border-b [&>tr>th]:border-r [&>tr>td]:border-r [&>tr>th]:border-border [&>tr>td]:border-border [&>tr>th]:px-4 [&>tr>th]:py-2 [&>tr>td]:px-4 [&>tr>td]:py-2 [&>tr:nth-child(even)]:bg-muted/30 first:[&>tbody>tr]:border-t',
        className
      )}
      {...props}
    />
  )
);

TypographyTable.displayName = 'TypographyTable';

const TypographyTableContainer = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('my-6 w-full overflow-x-auto', className)} {...props} />
  )
);

TypographyTableContainer.displayName = 'TypographyTableContainer';

export {
  TypographyBlockquote,
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyInlineCode,
  TypographyLarge,
  TypographyLead,
  TypographyList,
  TypographyMuted,
  TypographyP,
  TypographySmall,
  TypographyTable,
  TypographyTableContainer,
};
