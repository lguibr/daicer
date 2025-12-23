# Strapi Docs

---

title: Project structure
displayed_sidebar: cmsSidebar
description: Discover the project structure of any default Strapi application.
tags:

- project structure
- typescript

---

import InteractiveProjectStructure from '@site/src/components/ProjectStructure.js'

# Project structure

The structure of a Strapi project depends on whether the project was created with [TypeScript](/cms/typescript) (which is the default if you used the `--quickstart` option while creating the project) or with vanilla JavaScript, and looks like the following:

<InteractiveProjectStructure />

---

title: Content Manager
description: Learn to use the Content Manager.
toc_max_heading_level: 4
tags:

- admin panel
- content manager
- list view
- edit view
- component
- dynamic zone
- relational field

---

import ScreenshotNumberReference from '/src/components/ScreenshotNumberReference.jsx';

# Content Manager

<Tldr>
The Content Manager is Strapi’s interface for browsing and editing entries. This documentation gives an overview of the Content Manager and explains the views and how to write content in fields, components, dynamic zones and relational fields.
</Tldr>

From the <Icon name="feather" /> Content Manager, accessible via the main navigation of the admin panel, users can write and manage their content.

<IdentityCard>
  <IdentityCardItem icon="user" title="Role & permission">Minimum "Configure view" permissions in Roles > Plugins - Content Manager.</IdentityCardItem>
  <IdentityCardItem icon="desktop" title="Environment">Available in both Development & Production environment.</IdentityCardItem>
</IdentityCard>

## Overview

<!--
<ThemedImage
alt="Content Manager"
sources={{
    light: '/img/assets/content-manager-guideflow2.gif',
    dark: '/img/assets/content-manager-guideflow2.gif',
  }}
/>
-->

<!-- TODO: create dark mode version and replace the darkId value -->
<Guideflow lightId="zpen5g4t8p" darkId="9r22q12szr" />

The <Icon name="feather" /> Content Manager contains the available collection and single content-types which were created beforehand using the [Content-type Builder](/cms/features/content-type-builder).

Content can be created, managed and published from the 2 categories displayed in the sub navigation of the <Icon name="feather" /> Content Manager:

- _Collection types_, which lists available content-types managing several entries. For each available collection type, multiple entries can be created, which is why each collection type is divided into 2 interfaces:
  - the list view, which displays a table with all entries created for that collection type.
  - the edit view, which focuses on a chosen entry of your collection type, and from where you can actually manage the content.

- _Single types_, which lists available content-types with only one entry. Unlike collection types, which have multiple entries, single types are not created for multiple uses. In other words, there can only be one default entry per available single type. There is therefore no list view in the Single types category.

:::tip
Click the search icons <Icon name="magnifying-glass" classes="ph-bold" /> to use a text search and find one of your content-types and/or entries more quickly!

Specifically for your collection types' entries, you can also use the <Icon name="funnel-simple" classes="ph-bold" /> **Filters** button to set condition-based filters, which add to one another (i.e., if you set several conditions, only the entries that match all the conditions will be displayed).
:::

<!-- TO INTEGRATE IN THE PAGE? USE A GUIDEFLOW?

From the list view, it is possible to:

- create a new entry <ScreenshotNumberReference number="1" />,
- make a textual search <ScreenshotNumberReference number="2" /> or set filters <ScreenshotNumberReference number="3" /> to find specific entries,
- if [Internationalization (i18n)](/cms/features/internationalization) is enabled, filter by locale to display only the entries [translated](/cms/features/internationalization) in a chosen locale <ScreenshotNumberReference number="4" />,
- configure the fields displayed in the table of the list view <ScreenshotNumberReference number="5" />,
- if [Draft & Publish](/cms/features/draft-and-publish) is enabled, see the status of each entry <ScreenshotNumberReference number="6" />,
- perform actions on a specific entry by clicking on <Icon name="dots-three-outline" /> <ScreenshotNumberReference number="7" /> at the end of the row:
  - edit <Icon name="pencil-simple" /> (see [Writing content](/cms/features/content-manager/writing-content.md)), duplicate <Icon name="copy" />, or delete <Icon name="trash"/> (see [Deleting content](/cms/features/draft-and-publish#deleting-content)) the entry,
  - if [Draft & Publish](/cms/features/draft-and-publish) is enabled, <Icon name="x-circle" /> unpublish the entry, <Icon name="x-circle" /> or discard its changes,
  - if [Internationalization (i18n)](/cms/features/internationalization) is enabled, ![Delete locale icon](/img/assets/icons/v5/delete-locale.svg) delete a given locale,
- select multiple entries to simultaneously [publish, unpublish](/cms/features/draft-and-publish#bulk-publishing-and-unpublishing), or [delete](/cms/features/draft-and-publish#deleting-content).

:::tip
Sorting can be enabled for most fields displayed in the list view table (see <ExternalLink to="../content-manager/configuring-view-of-content-type.md" text="Configuring the views of a content-type"/>). Click on a field name, in the header of the table, to sort on that field.
:::
-->

<!-- WON'T BE INTEGRATED - TO BE VALIDATED

#### Filtering entries {#filtering-entries}

Right above the list view table, on the left side of the interface, a <Icon name="funnel-simple" classes="ph-bold" /> **Filters** button is displayed. It allows to set one or more condition-based filters, which add to one another (i.e. if you set several conditions, only the entries that match all the conditions will be displayed).

<ThemedImage
  alt="Filters in the Content Manager"
  sources={{
    light: '/img/assets/content-manager/content-manager_filters2.png',
    dark: '/img/assets/content-manager/content-manager_filters2_DARK.png',
  }}
/>

To set a new filter:

1. Click on the <Icon name="funnel-simple" classes="ph-bold" /> **Filters** button.
2. Click on the 1st drop-down list to choose the field on which the condition will be applied.
3. Click on the 2nd drop-down list to choose the type of condition to apply.
4. Enter the value(s) of the condition in the remaining textbox.
5. Click on the **Add filter** button.

:::note
When active, filters are displayed next to the <Icon name="funnel-simple" classes="ph-bold" /> **Filters** button. They can be removed by clicking on the delete icon <Icon name="x" />.
:::
-->

## Configuration

Both the list view and the edit view can be configured, and the former can either be configured temporarily or permanently.

### Configuring the list view {#list-view-settings}

<br/>

#### Temporary configuration

By configuring temporarily the list view, the configurations will be reset as soon as the page is refreshed or when navigating outside the Content Manager. This configuration allows to temporarily choose which fields to display in the list view's table.

1. Click on the settings button <Icon name="gear-six" />.
2. Tick the boxes associated with the field you want to be displayed in the table.
3. Untick the boxes associated with the fields you do not want to be displayed in the table.

<!-- MAY BE REMOVED - NOT SURE ABOUT RELEVANCE

:::tip
Relational fields can also be displayed in the list view. Please refer to <ExternalLink to="../content-manager/configuring-view-of-content-type.md" text="Configuring the views of a content-type"/> for more information on their specificities.
:::
-->

<ThemedImage
alt="Displayed fields in the settings of a list view in the Content Manager"
sources={{
    light: '/img/assets/content-manager/content-manager_displayed-fields.png',
    dark: '/img/assets/content-manager/content-manager_displayed-fields_DARK.png',
  }}
/>

#### Permanent & advanced configuration

By configuring permanently the list view, you not only ensure that they are not reset at every page refresh or navigation, but you also have access to more options (e.g., enablement/disablement of search, filters and bulk actions, reordering of the list view table's fields etc.).

:::note
The configurations only apply to the list view of the collection type from which the settings are accessed (i.e., disabling the filters or search options for a collection type will not automatically also disable these same options for all other collection types).
:::

<ThemedImage
alt="Settings of a list view in the Content Manager"
sources={{
    light: '/img/assets/content-manager/content-manager_settings-list-view.png',
    dark: '/img/assets/content-manager/content-manager_settings-list-view_DARK.png',
  }}
/>

<Tabs groupId="ListViewConfig">

<TabItem value="ListViewSettings" label="Settings">

1. In the list view of your collection type, click on the settings button <Icon name="gear-six" /> then <Icon name="list-plus" classes="ph-bold" /> **Configure the view** to be redirected to the list view configuration interface.
2. In the Settings area, define your chosen new settings:

| Setting name           | Instructions                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| Enable search          | Click on **TRUE** or **FALSE** to able or disable the search.                                          |
| Enable filters         | Click on **TRUE** or **FALSE** to able or disable filters.                                             |
| Enable bulk actions    | Click on **TRUE** or **FALSE** to able or disable the multiple selection boxes in the list view table. |
| Entries per page       | Choose among the drop-down list the number of entries per page.                                        |
| Default sort attribute | Choose the sorting field that will be used by default.                                                 |
| Default sort order     | Choose the sorting type that will be applied by default.                                               |

3. Click on the **Save** button.

</TabItem>

<TabItem value="ListViewDisplay" label="View">

1. In the list view of your collection type, click on the settings button <Icon name="gear-six" /> then <Icon name="list-plus" classes="ph-bold" /> **Configure the view** to be redirected to the list view configuration interface.
2. In the View area, define what fields to display in the list view table, and in what order:
   - Click the add button <Icon name="plus" classes="ph-bold" /> to add a new field.
   - Click the delete button <Icon name="x" /> to remove a field.
   - Click the reorder button <Icon name="dots-six-vertical" classes="ph-bold" /> and drag and drop it to the place you want it to be displayed among the other fields.
3. Click the edit button <Icon name="pencil-simple" /> to access its available own settings:

| Setting name              | Instructions                                                             |
| ------------------------- | ------------------------------------------------------------------------ |
| Label                     | Write the label to be used for the field in the list view table.         |
| Enable sort on this field | Click on **TRUE** or **FALSE** to able or disable the sort on the field. |

4. Click on the **Save** button.

:::note
Relational fields can also be displayed in the list view. There are however some specificities to keep in mind:

- Only one field can be displayed per relational field.
- Only first-level fields can be displayed (i.e. fields from the relation of a relation can't be displayed).
- If the displayed field contains more than one value, not all its values will be displayed, but a counter indicating the number of values. You can hover this counter to see a tooltip indicating the first 10 values of the relational field.

Note also that relational fields have a couple limitations when it comes to sorting options:

- Sorting cannot be enabled for relational fields which display several fields.
- Relational fields cannot be set as default sort.
  :::

</TabItem>

</Tabs>

### Configuring the edit view {#edit-view-settings}

<ThemedImage
alt="Configuring the edit view of the Content Manager"
sources={{
    light: '/img/assets/content-manager/edit-view-config2.png',
    dark: '/img/assets/content-manager/edit-view-config2_DARK.png',
  }}
/>

<Tabs groupId="EditViewConfig">

<TabItem value="EditViewSettings" label="Settings">

1. In the edit view of your content-type, click on the <Icon name="dots-three-outline" /> button then <Icon name="list-plus" classes="ph-bold" /> **Configure the view**.
2. In the Settings area, define your chosen new settings:

| Setting name | Instructions                                                                          |
| ------------ | ------------------------------------------------------------------------------------- |
| Entry title  | Choose among the drop-down list the field that should be used as title for the entry. |

3. Click on the **Save** button.

</TabItem>

<TabItem value="EditViewDisplay" label="View">

1. In the edit view of your content-type, click on the <Icon name="dots-three-outline" /> button then <Icon name="list-plus" classes="ph-bold" /> **Configure the view**.
2. In the View area, define what fields (including relational fields) to display in the list view table, in what order and what size:
   - Click the <Icon name="plus" classes="ph-bold" /> **Insert another field** button to add a new field.
   - Click the delete button <Icon name="x" /> to remove a field.
   - Click the reorder button <Icon name="dots-six-vertical" classes="ph-bold" /> and drag and drop it to the place you want it to be displayed among the other fields.
3. Click the edit button <Icon name="pencil-simple" /> of a field to access its available settings:

| Setting name   | Instructions                                                                                                                                                                                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Label          | Write the label that should be used for the field.                                                                                                                                                                                                                                                            |
| Description    | Write a description for the field, to help other administrators fill it properly.                                                                                                                                                                                                                             |
| Placeholder    | Write the placeholder that should be displayed by default in the field.                                                                                                                                                                                                                                       |
| Editable field | Click on **TRUE** or **FALSE** to able or disable the edition of the field by administrators.                                                                                                                                                                                                                 |
| Size           | Select the size in which the field should be displayed in the Content Manager. Note that this setting is neither available for JSON and Rich Text fields, nor dynamic zones and components.                                                                                                                   |
| Entry title    | _(relational fields only)_ Write the entry title that should be used for the relational field. It is recommended to choose well the entry title of relational fields as the more comprehensive it is, the easier it will be for administrators to manage the content of relational fields from the edit view. |

4. Click on the **Save** button.

:::caution
The settings and display of a component's fields cannot be managed and reordered through the entry's edit view configuration page. Click on the **Set the component's layout** button of a component to access the component's own configuration page. You will find the exact same settings and display options as for the entry, but that will specifically apply to your component.

Note also that the settings are defined for the component itself, which means that the settings will automatically be applied for every other content-type where the component is used.
:::

</TabItem>

</Tabs>

## Usage

<br/>

### Creating & Writing content

In Strapi, writing content consists in filling up fields, which are meant to contain specific content (e.g. text, numbers, media, etc.). These fields were configured for the collection or single type beforehand, through the [Content-type Builder](/cms/features/content-type-builder).

<ThemedImage
alt="Edit view to write content"
sources={{
    light: '/img/assets/content-manager/edit-view3.png',
    dark: '/img/assets/content-manager/edit-view3_DARK.png',
  }}
/>

To write or edit content:

1. In the <Icon name="feather" /> Content Manager:
   - Either click on the **Create new entry** button in the top right corner of the collection type of your choice to create a new entry,
   - Or access the edit view of your already created collection type's entry or single type.
2. Write your content, following the available field schema. You can refer to the table below for more information and instructions on how to fill up each field type.

:::note
New entries are only considered created once some of their content has been written and saved once. Only then will the new entry be listed in the list view.
:::

<!-- MAY BE REMOVED - NOT SURE ABOUT RELEVANCE

:::info
If Draft & Publish is enabled for your content-type (it's enabled by default), the fields work the same way whether you are editing the draft or published version.
:::
-->

| Field name           | Instructions                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Text                 | Write your content in the textbox.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Rich text (Markdown) | Write your textual content in the editor, in Markdown. Some basic formatting options (titles, bold, italics, underline) are available in the top bar of the editor to apply to selected text. A **Preview mode/Markdown mode** button to switch between modes is also available. <br /><br /> 💡 The box can be expanded by clicking on **Expand** in the bottom bar. It displays side by side, at the same time, the textbox that you can edit and the preview.                                                                                                                                                                                                                                                     |
| Rich text (Blocks)   | Write and manage your content in the editor, which automatically renders live all additions/updates. In the Blocks editor, paragraphs behave as blocks of text: hovering on a paragraph will display an icon <Icon name="dots-six-vertical" classes="ph-bold"/> on which to click to reorder the content. Options to format or enrich the content are also accessible from the top bar of the editor (basic formatting options, code, links, image etc.). <!-- <br /><br /> 💡 Type `/` in the editor to have access to the list of all available options and select one. --> <br /><br /> 💡 You can use text formatting keyboard shortcuts in the Blocks editor (e.g. bold, italics, underline, and pasting link). |
| Number               | Write your number in the textbox. Up and down arrows, displayed on the right of the box, allow to increase or decrease the current number indicated in the textbox.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Date                 | 1. Click the date and/or time box. <br /> 2. Type the date and time or choose a date using the calendar and/or a time from the list. The calendar view fully supports keyboard-based navigation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Media                | 1. Click the media area. <br /> 2. Choose an asset from the [Media Library](/cms/features/media-library) or from a [folder](/cms/features/media-library#organizing-assets-with-folders) if you created some, or click the **Add more assets** button to add a new file to the Media Library. <br /><br /> 💡 It is possible to drag and drop the chosen file in the media area.                                                                                                                                                                                                                                                                                                                                      |
| Relation             | Choose an entry from the drop-down list. See [relational fields](#relational-fields) for more information.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Boolean              | Click on **TRUE** or **FALSE**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| JSON                 | Write your content, in JSON format, in the code textbox.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Email                | Write a complete and valid email address.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Password             | Write a password. <br /><br /> 💡 Click the <Icon name="eye" /> icon, displayed on the right of the box, to show the password.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Enumeration          | 1. Click the drop-down list. <br /> 2. Choose an entry from the list.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| UID                  | Write a unique identifier in the textbox. A "Regenerate" button, displayed on the right of the box, allows automatically generating a UID based on the content type name.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

:::note
Filling out a [custom field](/cms/features/content-type-builder#custom-fields) depends on the type of content handled by the field. Please refer to the dedicated documentation for each custom field hosted on the <ExternalLink to="https://market.strapi.io" text="Marketplace"/>.
:::

#### Components

Components are a combination of several fields, which are grouped together in the edit view. Writing their content works exactly like for independent fields, but there are some specificities to components.

There are 2 types of components: non-repeatable and repeatable components.

<Tabs groupId="Components">

<TabItem value="NonRepeatable" label="Non-repeatable components">

<ThemedImage
alt="Non-repeatable component - No entry yet"
width="80%"
sources={{
    light: '/img/assets/content-manager/edit-view_component3.png',
    dark: '/img/assets/content-manager/edit-view_component3_DARK.png',
  }}
/>
<ThemedImage
alt="Non-repeatable component - With entries"
width="80%"
sources={{
    light: '/img/assets/content-manager/edit-view_component2.png',
    dark: '/img/assets/content-manager/edit-view_component2_DARK.png',
  }}
/>

Non-repeatable components are a combination of fields that can be used only once.

By default, the combination of fields is not directly displayed in the edit view:

1. Click on the add button <Icon name="plus-circle" /> to add the component.
2. Fill in the fields of the component.

To delete the non-repeatable component, click on the delete button <Icon name="trash"/>, located in the top right corner of the component area.

</TabItem>

<TabItem value="Repeatable" label="Repeatable components">

<ThemedImage
alt="Repeatable component"
width="80%"
sources={{
    light: '/img/assets/content-manager/edit-view_component4.png',
    dark: '/img/assets/content-manager/edit-view_component4_DARK.png',
  }}
/>

Repeatable components are also a combination of fields, but they allow the creation of multiple component entries, all following the same combination of fields.

To add a new entry and display its combination of fields:

1. Click on the add button <Icon name="plus-circle" /> to add the component.
2. Fill in the fields of the component.
3. (optional) Click on the **Add an entry** button and fill in the fields again.

The repeatable component entries can be reordered or deleted directly in the edit view, using buttons displayed on the right of the entry area.

- Use the drag & drop button <Icon name="dots-six-vertical" classes="ph-bold" /> to reorder entries of your repeatable component.
- Use the delete button <Icon name="trash"/> to delete an entry from your repeatable component.

:::note
Unlike regular fields, the order of the entries of a repeatable component is important. It should correspond exactly to how end users will read/see the content.
:::

</TabItem>

</Tabs>

#### Dynamic zones

Dynamic zones are a combination of components, which themselves are composed of several fields. Writing the content of a dynamic zone requires additional steps in order to access the fields.

<ThemedImage
alt="Writing content for a dynamic zone"
sources={{
    light: '/img/assets/content-manager/edit-view_dynamic-zone-1.png',
    dark: '/img/assets/content-manager/edit-view_dynamic-zone-1_DARK.png',
  }}
/>

<ThemedImage
alt="Writing content for a dynamic zone"
sources={{
    light: '/img/assets/content-manager/edit-view_dynamic-zone-2.png',
    dark: '/img/assets/content-manager/edit-view_dynamic-zone-2_DARK.png',
  }}
/>

1. Click on the <Icon name="plus-circle" /> **Add a component to [dynamic zone name]** button.
2. Choose a component available for the dynamic zone.
3. Fill in the fields of the component.

Dynamic zones' components can also be reordered or deleted directly in the edit view, using buttons displayed in the top right corner of the component area.

- Use the drag & drop button <Icon name="dots-six-vertical" classes="ph-bold" /> to reorder components in your dynamic zone.
- Use the delete button <Icon name="trash"/> to delete a component from your dynamic zone.

:::tip
You can also use the keyboard to reorder components: focus the component using Tab, press Space on the drag & drop button <Icon name="dots-six-vertical" classes="ph-bold" /> and use the arrow keys to then re-order, pressing Space again to drop the item.
:::

:::note
Unlike regular fields, the order of the fields and components inside a dynamic field is important. It should correspond exactly to how end users will read/see the content.
:::

#### Relational fields

Relation-type fields added to a content-type allow establishing a relation with another collection type. These fields are called "relational fields".

The content of relational fields is written from the edit view of the content-type they belong to. However, relational fields can point to one or several entries of the other collection type, this is why in the Content Manager it is possible to manage a content-type's relational fields to choose which entries are relevant.

<details>
<summary>Example of relational fields</summary>

In my Strapi admin panel I have created 2 collection types:

- Restaurant, where each entry is a restaurant
- Category, where each entry is a type of restaurant

I want to assign a category to each of my restaurants, therefore I have established a relation between my 2 collection types: restaurants can have one category.

In the Content Manager, from the edit view of my Restaurant entries, I can manage the Category relational field, and choose which entry of Category is relevant for my restaurant.
<br/>

</details>

<!-- MAY BE REMOVED - FEELS LIKE REPETITION

The relational fields of a content-type are displayed among regular fields. For each relational field is displayed a drop-down list containing all available entry titles. It allows to choose which entry the relational fields should point to. You can either choose one or several entries depending on the type of relation that was established.-->

<ThemedImage
alt="Relational fields in the edit view"
sources={{
    light: '/img/assets/content-manager/edit-view_relational-fields2.png',
    dark: '/img/assets/content-manager/edit-view_relational-fields2_DARK.png',
  }}
/>

<Tabs groupId="RelationalFields">

<TabItem value="OneChoice" label="One-choice relational fields">

Many-to-one, one-to-one, and one-way types of relation only allow to choose one entry per relational field.

<ThemedImage
alt="One-choice relational fields"
width="40%"
sources={{
    light: '/img/assets/content-manager/RF_one-choice2.png',
    dark: '/img/assets/content-manager/RF_one-choice2_DARK.png',
  }}
/>

To select the only relevant relational field's entry:

1. In the content-type's edit view, click on the drop-down list of the relational field.
2. Among the list of entries, choose one.

To remove the entry selected in the drop-down list, click on the delete button <Icon name="x" />.

</TabItem>

<TabItem value="MultipleChoice" label="Multiple-choice relational fields">

Many-to-many, one-to-many, and many-ways types of relation allow to choose several entries per relational field.

<ThemedImage
alt="Multiple choices relational fields"
width="40%"
sources={{
    light: '/img/assets/content-manager/RF_multiple-choices2.png',
    dark: '/img/assets/content-manager/RF_multiple-choices2_DARK.png',
  }}
/>

To select the relevant relational field's entries:

1. In the content-type's edit view, click on the drop-down list of the relational field.
2. Among the list of entries, choose one.
3. Repeat step 2 until all relevant entries have been chosen.

To remove an entry, click on the cross button <Icon name="x" classes="ph-bold" /> in the selected entries list.

Entries from multiple-choice relational fields can be reordered, indicated by a drag button <Icon name="dots-six-vertical" classes="ph-bold" />. To move an entry, click and hold it, drag it to the desired position, then release it.

</TabItem>

</Tabs>

:::tip

- Not all entries are listed by default: more can be displayed by clicking on the **Load more** button. Also, instead of choosing an entry by scrolling the list, you can click any relational field drop-down list and type to search a specific entry.

- Click on the name of an entry to display a modal from where you will be able to edit the relational field's content-type. For now, you can only edit a relation on-the-fly and not create a new one.
  :::

:::note

- If the [Draft & Publish feature](/cms/features/draft-and-publish) is activated for the content-type the relational field belongs to, you will notice blue or green dots next to the entries names in the drop-down list. They indicate the status of the entry, respectively draft or published content.
- If the [Internationalization (i18n) feature](/cms/features/internationalization) is enabled for the content-type, the list of entries may be limited or differ from one locale to another. Only relevant entries that can possibly be chosen for a relational field will be listed.
  :::

<!-- Add a section "Managing entries" here with the explanations of the list view interface? Or before "Creating & Writing content"? Or maybe have 1. "Creating & managing entries" 2. "Writing content"? Or just use a Guideflow? -->

### Deleting content

You can delete content by deleting any entry of a collection type, or the default entry of a single type.

1. In the edit view of the entry, click on <Icon name="dots-three-outline" /> at the top right of the interface, and click the **Delete document** button.<br/>If Internationalization is enabled for the content-type, you can also choose to delete only the currently selected locale by clicking on the **Delete locale** button.
2. In the window that pops up, click on the **Confirm** button to confirm the deletion.

<ThemedImage
alt="Deleting entries"
sources={{
    light: '/img/assets/content-manager/deleting-entries.png',
    dark: '/img/assets/content-manager/deleting-entries_DARK.png',
  }}
/>

:::tip
You can delete entries from the list view of a collection type, by clicking on <Icon name="dots-three-outline" /> on the right side of the entry's record in the table, then choosing the <Icon name="trash"/> **Delete document** button.<br/>If [Internationalization](/cms/features/internationalization) is enabled for the content-type, **Delete document** deletes all locales while **Delete locale** only deletes the currently listed locale.

---

title: Content-type Builder
description: Learn to use the Content-type Builder.
toc_max_heading_level: 5
tags:

- admin panel
- content type builder
- content types
- component
- dynamic zone
- custom field

---

import ScreenshotNumberReference from '/src/components/ScreenshotNumberReference.jsx';
import ConditionalFields from '/docs/snippets/conditional-fields.md'
import StrapiAiCredits from '/docs/snippets/strapi-ai-credits.md'

# Content-type Builder

<Tldr>
The Content-type Builder is a tool for designing content types and components. This documentation gives an overview of the Content-type Builder and covers field options, relations, component usage, and shares data modeling tips.
</Tldr>

From the <Icon name="layout" /> Content-type Builder, accessible via the main navigation of the admin panel, users can create and edit their content types.

<IdentityCard>
  <IdentityCardItem icon="user" title="Role & permission">Minimum "Read" permission in Roles > Plugins - Content Type Builder.</IdentityCardItem>
  <IdentityCardItem icon="desktop" title="Environment">Available in Development environment only.</IdentityCardItem>
</IdentityCard>

## Overview

<Guideflow lightId="lpnm3w1ber" darkId="zklmd4gijr" />

The <Icon name="layout" /> Content-type Builder allows the creation and management of content-types, which can be:

- Collection types: content-types that can manage several entries.
- Single types: content-types that can only manage one entry.
- Components: content structure that can be used in multiple collection types and single types. Although they are technically not proper content-types because they cannot exist independently, components are also created and managed through the Content-type Builder, in the same way as collection and single types.

All 3 are displayed as categories in the sub navigation of the <Icon name="layout" /> Content-type Builder. In each category are listed all content-types and components that have already been created.

:::tip
Click the search icon <Icon name="magnifying-glass" classes="ph-bold" /> in the <Icon name="layout" /> Content-type Builder sub navigation to find a specific collection type, single type, or component.
:::

In the Content-type Builder's sub navigation is also displayed a centralised **Save** button that applies for all content-types and components. Along with the display of statuses for both content-types/components and fields, this allows you to work on several content-types and components at the same time. The following statuses can be displayed:

- `New` or `N` indicates that a content-type/component or field is new and hasn't been saved yet,
- `Modified` or `M` indicates that a content-type/component or field has been modified since the last save,
- `Deleted` or `D` indicates that a content-type/component or field has been deleted but that it will only be confirmed once saved.

:::note
Clicking on the **...** button next to **Save** gives access to other options, such as **Undo/Redo last change** and **Discard all changes**. These options are also centralised, meaning that they apply to the last action(s) that was/were done on all content-types, components and fields since the last time you saved.
:::

## Usage

<br/>

### Creating content-types

The Content-type Builder allows to create new content-types: single and collection types, but also components.

#### Creating content-types with Strapi AI <NewBadge /> {#strapi-ai}

<GrowthBadge />

[When enabled](/cms/configurations/admin-panel#strapi-ai), Strapi AI adds an assistant that helps you create or edit content types with natural language.

To use Strapi AI with the Content-Type Builder, click on the <Icon name="sparkle" color="#7B79FF"/> button in the bottom right corner of the admin panel, and describe what you need:

<ThemedImage
alt="Strapi AI in Content-Type Builder"
sources={{
    light: '/img/assets/content-manager/strapi-ai-ctb.gif',
    dark: '/img/assets/content-manager/strapi-ai-ctb.gif',
  }}
/>

You can also use the <Icon name="paperclip" classes="ph" /> button at the bottom of the chat window to import code from an existing Strapi or front-end application, import a Figma project, or attach an image to extract the content structure from a design.

:::tip
The more precise your prompts, the more accurate your created schemas are likely to be.

For example, the following prompt example works well when creating relations: `Could you please generate a collection of dogs then also generate an owner collection and add relationship to dogs? An owner can have multiple dogs, but a dog can only have one owner.`
:::

<StrapiAiCredits />

#### Creating content-types manually {#new-content-type}

<ThemedImage
alt="Content-type creation"
sources={{
    light: '/img/assets/content-type-builder/content-type-creation.png',
    dark: '/img/assets/content-type-builder/content-type-creation_DARK.png',
  }}
/>

1. Choose whether you want to create a collection type or a single type.
2. In the <Icon name="layout" /> Content-type Builder's category of the content-type you want to create, click on **Create new collection/single type**.
3. In the content-type creation window, write the name of the new content-type in the _Display name_ textbox.
4. Check the _API ID_ to make sure the automatically pre-filled values are correct. Collection type names are indeed automatically pluralized when displayed in the Content Manager. It is recommended to opt for singular names, but the _API ID_ field allows to fix any pluralization mistake.
5. (optional) In the Advanced Settings tab, configure the available settings for the new content-type:
   | Setting name | Instructions |
   |-----------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
   | Draft & publish | Tick the checkbox to allow entries of the content-type to be managed as draft versions, before they are published (see [Draft & Publish](/cms/features/draft-and-publish)). |
   | Internationalization | Tick the checkbox to allow entries of the content-type to be translated into other locales. |
6. Click on the **Continue** button.
7. Add and configure chosen fields for your content-type (see [Configuring fields for content-types](#configuring-fields-content-type)).
8. Click on the **Save** button.

:::caution
New content-types are only considered created once they have been saved. Saving is only possible if at least one field has been added and properly configured. If these steps have not been done, a content-type cannot be created, listed in its category in the Content-type Builder, and cannot be used in the [Content Manager](/cms/features/content-manager).
:::

#### New component

<ThemedImage
alt="Component creation"
sources={{
    light: '/img/assets/content-type-builder/component-creation-1.png',
    dark: '/img/assets/content-type-builder/component-creation-1_DARK.png',
  }}
/>

1. In the Components category of the <Icon name="layout" /> Content-type Builder sub navigation, click on **Create new component**.
2. In the component creation window, configure the basic settings of the new component:
   - Write the name of the component in the _Display name_ textbox.
   - Select an available category, or enter in the textbox a new category name to create one.
   - _(optional)_ Choose an icon representing the new component. You can use the search <Icon name="magnifying-glass" classes="ph-bold" /> to find an icon instead of scrolling through the list.
3. Click on the **Continue** button.
4. Add and configure chosen fields for your component (see [Configuring fields for content-types](#configuring-fields-content-type)).
5. Click on the **Save** button.

### Editing content-types

The Content-type Builder allows to manage all existing content-types. For an chosen content-type or component to edit, the right side of the Content-type Builder interface displays all available editing and management options.

<ThemedImage
alt="Content-type Builder's edition interface"
sources={{
    light: '/img/assets/content-type-builder/new_CTB.png',
    dark: '/img/assets/content-type-builder/new_CTB_DARK.png',
  }}
/>

#### Settings

1. Click on the <Icon name="pencil-simple" /> **Edit** button of your content-type to access its settings.
2. Edit the available settings of your choice:

  <Tabs groupId="CTSettings">

  <TabItem value="CTBasicSettings" label="Basic settings">

<ThemedImage
alt="Content-type Builder's basic settings"
sources={{
      light: '/img/assets/content-type-builder/basic-settings.png',
      dark: '/img/assets/content-type-builder/basic-settings_DARK.png',
    }}
/>

- **Display name**: Name of the content-type or component as it will be displayed in the admin panel.
- **API ID (singular)**: Name of the content-type or component as it will be used in the API. It is automatically generated from the display name, but can be edited.
- **API ID (plural)**: Plural name of the content-type or component as it will be used in the API. It is automatically generated from the display name, but can be edited.
- **Type**: Type of the content-type or component. It can be either a **Collection type** or a **Single type**.

  </TabItem>

  <TabItem value="CTAdvancedSettings" label="Advanced settings">

<ThemedImage
alt="Content-type Builder's advanced settings"
sources={{
      light: '/img/assets/content-type-builder/advanced-settings.png',
      dark: '/img/assets/content-type-builder/advanced-settings_DARK.png',
    }}
/>

- **Draft & Publish**: Enable the [Draft & Publish](/cms/features/draft-and-publish) feature for the content-type or component. It is disabled by default.
- **Internationalization**: Enable the [Internationalization](/cms/features/internationalization) feature for the content-type or component. It is disabled by default.

  </TabItem>

  </Tabs>

3. Click the **Finish** button in the dialog.
4. Click the **Save** button in the Content-Type Builder navigation.

#### Fields

From the table that lists the fields of your content-type, you can:

- Click on the <Icon name="pencil-simple" /> button to access a field's basic and advanced settings to edit them
- Click on the **Add another field** buttons to create a new field for the selected content-type
- Click on the <Icon name="dots-six-vertical" classes="ph-bold"/> button and drag and drop any field to reorder the content-type's fields
- Click on the <Icon name="trash" /> button to delete a field

:::caution
Editing a field allows renaming it. However, keep in mind that regarding the database, renaming a field means creating a whole new field and deleting the former one. Although nothing is deleted from the database, the data that was associated with the former field name will not be accessible from the admin panel of your application anymore.
:::

### Configuring content-types fields {#configuring-fields-content-type}

Content-types are composed of one or several fields. Each field is designed to contain specific kind of data, filled up in the Content Manager (see [Creating & Writing content](/cms/features/content-manager#creating--writing-content)).

In the <Icon name="layout" /> Content-type Builder, fields can be added at the creation of a new content-type or component, or afterward when a content-type or component is edited or updated.

:::note
Depending on what content-type or component is being created or edited, not all fields -including components and dynamic zones- are always available.
:::

<ThemedImage
alt="Fields selection"
sources={{
    light: '/img/assets/content-type-builder/fields-selection.png',
    dark: '/img/assets/content-type-builder/fields-selection_DARK.png',
  }}
/>

#### <img width="28" src="/img/assets/icons/v5/ctb_text.svg" /> Text {#text}

The Text field displays a textbox that can contain small text. This field can be used for titles, descriptions, etc.

<Tabs>

<TabItem value="base" label="Basic settings">

| Setting name | Instructions                                                                                                                 |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Name         | Write the name of the Text field.                                                                                            |
| Type         | Choose between _Short text_ (255 characters maximum) and _Long text_, to allow more or less space to fill up the Text field. |

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name                       | Instructions                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default value                      | Write the default value of the Text field.                                                                                                            |
| RegExp pattern                     | Write a regular expression to make sure the value of the Text field matches a specific format.                                                        |
| Private field                      | Tick to make the field private and prevent it from being found via the API.                                                                           |
| Enable localization for this field | (if [Internationalization](/cms/features/internationalization) is enabled for the content-type) Allow the field to have a different value per locale. |
| Required field                     | Tick to prevent creating or saving an entry if the field is not filled in.                                                                            |
| Unique field                       | Tick to prevent another field to be identical to this one.                                                                                            |
| Maximum length                     | Tick to define a maximum number of characters allowed.                                                                                                |
| Minimum length                     | Tick to define a minimum number of characters allowed.                                                                                                |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>

#### <img width="28" src="/img/assets/icons/v5/ctb_richtextblocks.svg" /> Rich Text (Blocks) {#rich-text-blocks}

The Rich Text (Blocks) field displays an editor with live rendering and various options to manage rich text. This field can be used for long written content, even including images and code.

<Tabs>

<TabItem value="base" label="Basic settings">

| Setting name | Instructions                                    |
| ------------ | ----------------------------------------------- |
| Name         | Write the name of the Rich Text (Blocks) field. |

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name                       | Instructions                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Private field                      | Tick to make the field private and prevent it from being found via the API.                                                                           |
| Required field                     | Tick to prevent creating or saving an entry if the field is not filled in.                                                                            |
| Enable localization for this field | (if [Internationalization](/cms/features/internationalization) is enabled for the content-type) Allow the field to have a different value per locale. |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>

:::strapi React renderer
If using the Blocks editor, we recommend that you also use the <ExternalLink to="https://github.com/strapi/blocks-react-renderer" text="Strapi Blocks React Renderer"/> to easily render the content in a React frontend.
:::

#### <img width="28" src="/img/assets/icons/v5/ctb_number.svg" /> Number {#number}

The Number field displays a field for any kind of number: integer, decimal and float.

<Tabs>

<TabItem value="base" label="Basic settings">

| Setting name  | Instructions                                                    |
| ------------- | --------------------------------------------------------------- |
| Name          | Write the name of the Number field.                             |
| Number format | Choose between _integer_, _big integer_, _decimal_ and _float_. |

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name                       | Instructions                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default value                      | Write the default value of the Number field.                                                                                                          |
| Private field                      | Tick to make the field private and prevent it from being found via the API.                                                                           |
| Enable localization for this field | (if [Internationalization](/cms/features/internationalization) is enabled for the content-type) Allow the field to have a different value per locale. |
| Required field                     | Tick to prevent creating or saving an entry if the field is not filled in.                                                                            |
| Unique field                       | Tick to prevent another field to be identical to this one.                                                                                            |
| Maximum value                      | Tick to define a maximum value allowed.                                                                                                               |
| Minimum value                      | Tick to define a minimum value allowed.                                                                                                               |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>

#### <img width="28" src="/img/assets/icons/v5/ctb_date.svg" /> Date {#date}

The Date field can display a date (year, month, day), time (hour, minute, second) or datetime (year, month, day, hour, minute, and second) picker.

<Tabs>

<TabItem value="base" label="Basic settings">

| Setting name | Instructions                                 |
| ------------ | -------------------------------------------- |
| Name         | Write the name of the Date field.            |
| Type         | Choose between _date_, _datetime_ and _time_ |

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name                       | Instructions                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default value                      | Write the default value of the Date field.                                                                                                            |
| Private field                      | Tick to make the field private and prevent it from being found via the API.                                                                           |
| Enable localization for this field | (if [Internationalization](/cms/features/internationalization) is enabled for the content-type) Allow the field to have a different value per locale. |
| Required field                     | Tick to prevent creating or saving an entry if the field is not filled in.                                                                            |
| Unique field                       | Tick to prevent another field to be identical to this one.                                                                                            |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>
 
#### <img width="28" src="/img/assets/icons/v5/ctb_password.svg" /> Password

The Password field displays a password field that is encrypted.

<Tabs>

<TabItem value="base" label="Basic settings">

| Setting name | Instructions                          |
| ------------ | ------------------------------------- |
| Name         | Write the name of the Password field. |

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name                       | Instructions                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default value                      | Write the default value of the Password field.                                                                                                        |
| Private field                      | Tick to make the field private and prevent it from being found via the API.                                                                           |
| Enable localization for this field | (if [Internationalization](/cms/features/internationalization) is enabled for the content-type) Allow the field to have a different value per locale. |
| Required field                     | Tick to prevent creating or saving an entry if the field is not filled in.                                                                            |
| Maximum length                     | Tick to define a maximum number of characters allowed.                                                                                                |
| Minimum length                     | Tick to define a minimum number of characters allowed.                                                                                                |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>

#### <img width="28" src="/img/assets/icons/v5/ctb_media.svg" /> Media {#media}

The Media field allows to choose one or more media files (e.g. image, video) from those uploaded in the Media Library of the application.

<Tabs>

<TabItem value="base" label="Basic settings">

| Setting name | Instructions                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------------- |
| Name         | Write the name of the Media field.                                                                                  |
| Type         | Choose between _Multiple media_ to allow multiple media uploads, and _Single media_ to only allow one media upload. |

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name                       | Instructions                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Select allowed types of media      | Click on the drop-down list to untick media types not allowed for this field.                                                                         |
| Private field                      | Tick to make the field private and prevent it from being found via the API.                                                                           |
| Enable localization for this field | (if [Internationalization](/cms/features/internationalization) is enabled for the content-type) Allow the field to have a different value per locale. |
| Required field                     | Tick to prevent creating or saving an entry if the field is not filled in.                                                                            |
| Unique field                       | Tick to prevent another field to be identical to this one.                                                                                            |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>

#### <img width="28" src="/img/assets/icons/v5/ctb_relation.svg" /> Relation {#relation}

The Relation field allows to establish a relation with another content-type, that must be a collection type.

There are 6 different types of relations:

- <img width="25" src="/img/assets/icons/v5/ctb_relation_oneway.svg" /> One way: Content-type A _has one_ Content-type B
- <img width="25" src="/img/assets/icons/v5/ctb_relation_1to1.svg" /> One-to-one: Content-type A _has and belong to one_ Content-type B
- <img width="25" src="/img/assets/icons/v5/ctb_relation_1tomany.svg" /> One-to-many: Content-type A _belongs to many_ Content-type B
- <img width="25" src="/img/assets/icons/v5/ctb_relation_manyto1.svg" /> Many-to-one: Content-type B _has many_ Content-type A
- <img width="25" src="/img/assets/icons/v5/ctb_relation_manytomany.svg" /> Many-to-many: Content-type A _has and belongs to many_ Content-type B
- <img width="25" src="/img/assets/icons/v5/ctb_relation_manyway.svg" /> Many way: Content-type A _has many_ Content-type B

:::info Multi relations and single relations
Relations where at least one side can reference several entries are called multi relations. In the Content-type Builder, this includes one-to-many, many-to-one, many-to-many, and many-way relations. These relations appear as multi-select fields in the Content Manager and return arrays from the REST, GraphQL, and Document Service APIs; while single relations (one-way and one-to-one relations) return a single linked entry (see [Managing relations with API requests](/cms/api/rest/relations) for more information).
:::

<Tabs>

<TabItem value="base" label="Basic settings">

Configuring the basic settings of the Relation field consists in choosing with which existing content-type the relation should be established and the kind of relation. The edition window of the Relation field displays 2 grey boxes, each representing one of the content-types in relation. Between the grey boxes are displayed all possible relation types.

1. Click on the 2nd grey box to define the content-type B. It must be an already created collection type.
2. Click on the icon representing the relation to establish between the content-types.
3. Choose the _Field name_ of the content-type A, meaning the name that will be used for the field in the content-type A.
4. (optional if disabled by the relation type) Choose the _Field name_ of the content-type B.

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name  | Instructions                                                                |
| ------------- | --------------------------------------------------------------------------- |
| Private field | Tick to make the field private and prevent it from being found via the API. |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>

:::tip Modeling nested page hierarchies
To model a navigable tree of pages:

1. Add a `Page` collection type with a "Slug" (UID) and (optionally) an "Order" (Integer) field to control sibling ordering.
2. Create a Relation field from `Page` to `Page` and choose _Many-to-one_ so each page can set its "Parent page". Strapi automatically provides the inverse "Children pages" relation.
3. When reading data, populate `children` recursively to load the tree. Keep the recursion depth small to avoid large responses.

<details>
<summary>Example</summary>
```json title="Populate nested children for a page tree"
{
  populate: {
    children: {
      fields: ['title', 'slug'],
      populate: {
        children: {
          fields: ['title', 'slug'],
        },
      },
    },
  },
}
```
</details>

The same populate pattern works with GraphQL or the Document Service API (see [Understanding populate guide](/cms/api/rest/guides/understanding-populate#populate-several-levels-deep-for-specific-relations)).
:::

#### <img width="28" src="/img/assets/icons/v5/ctb_boolean.svg" /> Boolean {#boolean}

The Boolean field displays a toggle button to manage boolean values (e.g. Yes or No, 1 or 0, True or False).

<Tabs>

<TabItem value="base" label="Basic settings">

| Setting name | Instructions                         |
| ------------ | ------------------------------------ |
| Name         | Write the name of the Boolean field. |

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name                       | Instructions                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default value                      | Choose the default value of the Boolean field: _true_, _null_ or _false_.                                                                             |
| Private field                      | Tick to make the field private and prevent it from being found via the API.                                                                           |
| Enable localization for this field | (if [Internationalization](/cms/features/internationalization) is enabled for the content-type) Allow the field to have a different value per locale. |
| Required field                     | Tick to prevent creating or saving an entry if the field is not filled in.                                                                            |
| Unique field                       | Tick to prevent another field to be identical to this one.                                                                                            |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>

#### <img width="28" src="/img/assets/icons/v5/ctb_json.svg" /> JSON {#json}

The JSON field allows to configure data in a JSON format, to store JSON objects or arrays.

<Tabs>

<TabItem value="base" label="Basic settings">

| Setting name | Instructions                      |
| ------------ | --------------------------------- |
| Name         | Write the name of the JSON field. |

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name                       | Instructions                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Private field                      | Tick to make the field private and prevent it from being found via the API.                                                                           |
| Enable localization for this field | (if [Internationalization](/cms/features/internationalization) is enabled for the content-type) Allow the field to have a different value per locale. |
| Required field                     | Tick to prevent creating or saving an entry if the field is not filled in.                                                                            |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>

#### <img width="28" src="/img/assets/icons/v5/ctb_email.svg" /> Email {#email}

The Email field displays an email address field with format validation to ensure the email address is valid.

<Tabs>

<TabItem value="base" label="Basic settings">

| Setting name | Instructions                       |
| ------------ | ---------------------------------- |
| Name         | Write the name of the Email field. |

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name                       | Instructions                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default value                      | Write the default value of the Email field.                                                                                                           |
| Private field                      | Tick to make the field private and prevent it from being found via the API.                                                                           |
| Enable localization for this field | (if [Internationalization](/cms/features/internationalization) is enabled for the content-type) Allow the field to have a different value per locale. |
| Required field                     | Tick to prevent creating or saving an entry if the field is not filled in.                                                                            |
| Unique field                       | Tick to prevent another field to be identical to this one.                                                                                            |
| Maximum length                     | Tick to define a maximum number of characters allowed.                                                                                                |
| Minimum length                     | Tick to define a minimum number of characters allowed.                                                                                                |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>

#### <img width="28" src="/img/assets/icons/v5/ctb_password.svg" /> Password {#password}

The Password field displays a password field that is encrypted.

<Tabs>

<TabItem value="base" label="Basic settings">

| Setting name | Instructions                          |
| ------------ | ------------------------------------- |
| Name         | Write the name of the Password field. |

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name                       | Instructions                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default value                      | Write the default value of the Password field.                                                                                                        |
| Private field                      | Tick to make the field private and prevent it from being found via the API.                                                                           |
| Enable localization for this field | (if [Internationalization](/cms/features/internationalization) is enabled for the content-type) Allow the field to have a different value per locale. |
| Required field                     | Tick to prevent creating or saving an entry if the field is not filled in.                                                                            |
| Maximum length                     | Tick to define a maximum number of characters allowed.                                                                                                |
| Minimum length                     | Tick to define a minimum number of characters allowed.                                                                                                |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>

#### <img width="28" src="/img/assets/icons/v5/ctb_enum.svg" /> Enumeration {#enum}

The Enumeration field allows to configure a list of values displayed in a drop-down list.

<Tabs>

<TabItem value="base" label="Basic settings">

| Setting name | Instructions                                       |
| ------------ | -------------------------------------------------- |
| Name         | Write the name of the Enumeration field.           |
| Values       | Write the values of the enumeration, one per line. |

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name                       | Instructions                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default value                      | Choose the default value of the Enumeration field.                                                                                                    |
| Name override for GraphQL          | Write a custom GraphQL schema type to override the default one for the field.                                                                         |
| Private field                      | Tick to make the field private and prevent it from being found via the API.                                                                           |
| Enable localization for this field | (if [Internationalization](/cms/features/internationalization) is enabled for the content-type) Allow the field to have a different value per locale. |
| Required field                     | Tick to prevent creating or saving an entry if the field is not filled in.                                                                            |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>

:::caution
Enumeration values should always have an alphabetical character preceding any number as it could otherwise cause the server to crash without notice when the GraphQL plugin is installed.
:::

#### <img width="28" src="/img/assets/icons/v5/ctb_uid.svg" /> UID {#uid}

The UID field displays a field that sets a unique identifier, optionally based on an existing other field from the same content-type.

<Tabs>

<TabItem value="base" label="Basic settings">

| Setting name   | Instructions                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Name           | Write the name of the UID field. It must not contain special characters or spaces.                     |
| Attached field | Choose what existing field to attach to the UID field. Choose _None_ to not attach any specific field. |

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name   | Instructions                                                                |
| -------------- | --------------------------------------------------------------------------- |
| Default value  | Write the default value of the UID field.                                   |
| Private field  | Tick to make the field private and prevent it from being found via the API. |
| Required field | Tick to prevent creating or saving an entry if the field is not filled in.  |
| Maximum length | Tick to define a maximum number of characters allowed.                      |
| Minimum length | Tick to define a minimum number of characters allowed.                      |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>

:::tip
The UID field can be used to create a slug based on the Attached field.
:::

#### <img width="28" src="/img/assets/icons/v5/ctb_richtext.svg" /> Rich Text (Markdown) {#rich-text-markdown}

The Rich Text (Markdown) field displays an editor with basic formatting options to manage rich text written in Markdown. This field can be used for long written content.

<Tabs>

<TabItem value="base" label="Basic settings">

| Setting name | Instructions                                      |
| ------------ | ------------------------------------------------- |
| Name         | Write the name of the Rich Text (Markdown) field. |

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name                       | Instructions                                                                                                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Default value                      | Write the default value of the Rich Text field.                                                                                                              |
| Private field                      | Tick to make the field private and prevent it from being found via the API.                                                                                  |
| Enable localization for this field | (if [Internationalization plugin](/cms/features/internationalization) is enabled for the content-type) Allow the field to have a different value per locale. |
| Required field                     | Tick to prevent creating or saving an entry if the field is not filled in.                                                                                   |
| Maximum length                     | Tick to define a maximum number of characters allowed.                                                                                                       |
| Minimum length                     | Tick to define a minimum number of characters allowed.                                                                                                       |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>

#### <img width="28" src="/img/assets/icons/v5/ctb_component.svg" /> Components {#components}

Components are a combination of several fields. Components allow to create reusable sets of fields, that can be quickly added to content-types, dynamic zones but also nested into other components.

When configuring a component through the Content-type Builder, it is possible to either:

- create a new component by clicking on _Create a new component_ (see [Creating a new component](#new-component)),
- or use an existing one by clicking on _Use an existing component_.

<Tabs>

<TabItem value="base" label="Basic settings">

| Setting name       | Instructions                                                                                                                                                                        |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name               | Write the name of the component for the content-type.                                                                                                                               |
| Select a component | When using an existing component only - Select from the drop-down list an existing component.                                                                                       |
| Type               | Choose between _Repeatable component_ to be able to use several times the component for the content-type, or _Single component_ to limit to only one time the use of the component. |

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name                       | Instructions                                                                                                                                               |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Required field                     | Tick to prevent creating or saving an entry if the field is not filled in.                                                                                 |
| Private field                      | Tick to make the field private and prevent it from being found via the API.                                                                                |
| Maximum value                      | For repeatable components only - Tick to define a maximum number of characters allowed.                                                                    |
| Minimum value                      | For repeatable components only - Tick to define a minimum number of characters allowed.                                                                    |
| Enable localization for this field | (if [Internationalization](/cms/features/internationalization) is enabled for the content-type) Allow the component to be translated per available locale. |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>

#### <img width="28" src="/img/assets/icons/v5/ctb_dz.svg" /> Dynamic zones {#dynamiczones}

Dynamic zones are a combination of components that can be added to content-types. They allow a flexible content structure as once in the Content Manager, administrators have the choice of composing and rearranging the components of the dynamic zone how they want.

<Tabs>

<TabItem value="base" label="Basic settings">

| Setting name | Instructions                                             |
| ------------ | -------------------------------------------------------- |
| Name         | Write the name of the dynamic zone for the content-type. |

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name                       | Instructions                                                                                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Required field                     | Tick to prevent creating or saving an entry if the field is not filled in.                                                                                    |
| Maximum value                      | Tick to define a maximum number of characters allowed.                                                                                                        |
| Minimum value                      | Tick to define a minimum number of characters allowed.                                                                                                        |
| Enable localization for this field | (if [Internationalization](/cms/features/internationalization) is enabled for the content-type) Allow the dynamic zone to be translated per available locale. |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>

After configuring the settings of the dynamic zone, its components must be configured as well. It is possible to either choose an existing component or create a new one.

:::caution
When using dynamic zones, different components cannot have the same field name with different types (or with enumeration fields, different values).
:::

#### Custom fields

[Custom fields](/cms/features/custom-fields) are a way to extend Strapi’s capabilities by adding new types of fields to content-types or components. Once installed (see [Marketplace](/cms/plugins/installing-plugins-via-marketplace) documentation), custom fields are listed in the _Custom_ tab when selecting a field for a content-type.

Each custom field type can have basic and advanced settings. The <ExternalLink to="https://market.strapi.io/plugins?categories=Custom+fields" text="Marketplace"/> lists available custom fields, and hosts dedicated documentation for each custom field, including specific settings.

### Deleting content-types

Content types and components can be deleted through the Content-type Builder. Deleting a content-type automatically deletes all entries from the Content Manager that were based on that content-type. The same goes for the deletion of a component, which is automatically deleted from every content-type or entry where it was used.

1. In the <Icon name="layout" /> Content-type Builder sub navigation, click on the name of the content-type or component to delete.
2. In the edition interface of the chosen content-type or component, click on the <Icon name="pencil-simple" /> **Edit** button on the right side of the content-type's or component's name.
3. In the edition window, click on the **Delete** button.
4. In the confirmation window, confirm the deletion.
5. Click on the **Save** button in the Content-type Builder sub navigation.

:::caution
Deleting a content-type only deletes what was created and available from the Content-type Builder, and by extent from the admin panel of your Strapi application. All the data that was created based on that content-type is however kept in the database. For more information, please refer to the related <ExternalLink to="https://github.com/strapi/strapi/issues/1114" text="GitHub issue"/>.
:::

<ThemedImage
alt="Deletion of content type in Content-type Builder"
sources={{
    light: '/img/assets/content-type-builder/new_CTB_deletion.png',
    dark: '/img/assets/content-type-builder/new_CTB_deletion_DARK.png',
  }}
/>

---

title: Content-type Builder
description: Learn to use the Content-type Builder.
toc_max_heading_level: 5
tags:

- admin panel
- content type builder
- content types
- component
- dynamic zone
- custom field

---

import ScreenshotNumberReference from '/src/components/ScreenshotNumberReference.jsx';
import ConditionalFields from '/docs/snippets/conditional-fields.md'
import StrapiAiCredits from '/docs/snippets/strapi-ai-credits.md'

# Content-type Builder

<Tldr>
The Content-type Builder is a tool for designing content types and components. This documentation gives an overview of the Content-type Builder and covers field options, relations, component usage, and shares data modeling tips.
</Tldr>

From the <Icon name="layout" /> Content-type Builder, accessible via the main navigation of the admin panel, users can create and edit their content types.

<IdentityCard>
  <IdentityCardItem icon="user" title="Role & permission">Minimum "Read" permission in Roles > Plugins - Content Type Builder.</IdentityCardItem>
  <IdentityCardItem icon="desktop" title="Environment">Available in Development environment only.</IdentityCardItem>
</IdentityCard>

## Overview

<Guideflow lightId="lpnm3w1ber" darkId="zklmd4gijr" />

The <Icon name="layout" /> Content-type Builder allows the creation and management of content-types, which can be:

- Collection types: content-types that can manage several entries.
- Single types: content-types that can only manage one entry.
- Components: content structure that can be used in multiple collection types and single types. Although they are technically not proper content-types because they cannot exist independently, components are also created and managed through the Content-type Builder, in the same way as collection and single types.

All 3 are displayed as categories in the sub navigation of the <Icon name="layout" /> Content-type Builder. In each category are listed all content-types and components that have already been created.

:::tip
Click the search icon <Icon name="magnifying-glass" classes="ph-bold" /> in the <Icon name="layout" /> Content-type Builder sub navigation to find a specific collection type, single type, or component.
:::

In the Content-type Builder's sub navigation is also displayed a centralised **Save** button that applies for all content-types and components. Along with the display of statuses for both content-types/components and fields, this allows you to work on several content-types and components at the same time. The following statuses can be displayed:

- `New` or `N` indicates that a content-type/component or field is new and hasn't been saved yet,
- `Modified` or `M` indicates that a content-type/component or field has been modified since the last save,
- `Deleted` or `D` indicates that a content-type/component or field has been deleted but that it will only be confirmed once saved.

:::note
Clicking on the **...** button next to **Save** gives access to other options, such as **Undo/Redo last change** and **Discard all changes**. These options are also centralised, meaning that they apply to the last action(s) that was/were done on all content-types, components and fields since the last time you saved.
:::

## Usage

<br/>

### Creating content-types

The Content-type Builder allows to create new content-types: single and collection types, but also components.

#### Creating content-types with Strapi AI <NewBadge /> {#strapi-ai}

<GrowthBadge />

[When enabled](/cms/configurations/admin-panel#strapi-ai), Strapi AI adds an assistant that helps you create or edit content types with natural language.

To use Strapi AI with the Content-Type Builder, click on the <Icon name="sparkle" color="#7B79FF"/> button in the bottom right corner of the admin panel, and describe what you need:

<ThemedImage
alt="Strapi AI in Content-Type Builder"
sources={{
    light: '/img/assets/content-manager/strapi-ai-ctb.gif',
    dark: '/img/assets/content-manager/strapi-ai-ctb.gif',
  }}
/>

You can also use the <Icon name="paperclip" classes="ph" /> button at the bottom of the chat window to import code from an existing Strapi or front-end application, import a Figma project, or attach an image to extract the content structure from a design.

:::tip
The more precise your prompts, the more accurate your created schemas are likely to be.

For example, the following prompt example works well when creating relations: `Could you please generate a collection of dogs then also generate an owner collection and add relationship to dogs? An owner can have multiple dogs, but a dog can only have one owner.`
:::

<StrapiAiCredits />

#### Creating content-types manually {#new-content-type}

<ThemedImage
alt="Content-type creation"
sources={{
    light: '/img/assets/content-type-builder/content-type-creation.png',
    dark: '/img/assets/content-type-builder/content-type-creation_DARK.png',
  }}
/>

1. Choose whether you want to create a collection type or a single type.
2. In the <Icon name="layout" /> Content-type Builder's category of the content-type you want to create, click on **Create new collection/single type**.
3. In the content-type creation window, write the name of the new content-type in the _Display name_ textbox.
4. Check the _API ID_ to make sure the automatically pre-filled values are correct. Collection type names are indeed automatically pluralized when displayed in the Content Manager. It is recommended to opt for singular names, but the _API ID_ field allows to fix any pluralization mistake.
5. (optional) In the Advanced Settings tab, configure the available settings for the new content-type:
   | Setting name | Instructions |
   |-----------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
   | Draft & publish | Tick the checkbox to allow entries of the content-type to be managed as draft versions, before they are published (see [Draft & Publish](/cms/features/draft-and-publish)). |
   | Internationalization | Tick the checkbox to allow entries of the content-type to be translated into other locales. |
6. Click on the **Continue** button.
7. Add and configure chosen fields for your content-type (see [Configuring fields for content-types](#configuring-fields-content-type)).
8. Click on the **Save** button.

:::caution
New content-types are only considered created once they have been saved. Saving is only possible if at least one field has been added and properly configured. If these steps have not been done, a content-type cannot be created, listed in its category in the Content-type Builder, and cannot be used in the [Content Manager](/cms/features/content-manager).
:::

#### New component

<ThemedImage
alt="Component creation"
sources={{
    light: '/img/assets/content-type-builder/component-creation-1.png',
    dark: '/img/assets/content-type-builder/component-creation-1_DARK.png',
  }}
/>

1. In the Components category of the <Icon name="layout" /> Content-type Builder sub navigation, click on **Create new component**.
2. In the component creation window, configure the basic settings of the new component:
   - Write the name of the component in the _Display name_ textbox.
   - Select an available category, or enter in the textbox a new category name to create one.
   - _(optional)_ Choose an icon representing the new component. You can use the search <Icon name="magnifying-glass" classes="ph-bold" /> to find an icon instead of scrolling through the list.
3. Click on the **Continue** button.
4. Add and configure chosen fields for your component (see [Configuring fields for content-types](#configuring-fields-content-type)).
5. Click on the **Save** button.

### Editing content-types

The Content-type Builder allows to manage all existing content-types. For an chosen content-type or component to edit, the right side of the Content-type Builder interface displays all available editing and management options.

<ThemedImage
alt="Content-type Builder's edition interface"
sources={{
    light: '/img/assets/content-type-builder/new_CTB.png',
    dark: '/img/assets/content-type-builder/new_CTB_DARK.png',
  }}
/>

#### Settings

1. Click on the <Icon name="pencil-simple" /> **Edit** button of your content-type to access its settings.
2. Edit the available settings of your choice:

  <Tabs groupId="CTSettings">

  <TabItem value="CTBasicSettings" label="Basic settings">

<ThemedImage
alt="Content-type Builder's basic settings"
sources={{
      light: '/img/assets/content-type-builder/basic-settings.png',
      dark: '/img/assets/content-type-builder/basic-settings_DARK.png',
    }}
/>

- **Display name**: Name of the content-type or component as it will be displayed in the admin panel.
- **API ID (singular)**: Name of the content-type or component as it will be used in the API. It is automatically generated from the display name, but can be edited.
- **API ID (plural)**: Plural name of the content-type or component as it will be used in the API. It is automatically generated from the display name, but can be edited.
- **Type**: Type of the content-type or component. It can be either a **Collection type** or a **Single type**.

  </TabItem>

  <TabItem value="CTAdvancedSettings" label="Advanced settings">

<ThemedImage
alt="Content-type Builder's advanced settings"
sources={{
      light: '/img/assets/content-type-builder/advanced-settings.png',
      dark: '/img/assets/content-type-builder/advanced-settings_DARK.png',
    }}
/>

- **Draft & Publish**: Enable the [Draft & Publish](/cms/features/draft-and-publish) feature for the content-type or component. It is disabled by default.
- **Internationalization**: Enable the [Internationalization](/cms/features/internationalization) feature for the content-type or component. It is disabled by default.

  </TabItem>

  </Tabs>

3. Click the **Finish** button in the dialog.
4. Click the **Save** button in the Content-Type Builder navigation.

#### Fields

From the table that lists the fields of your content-type, you can:

- Click on the <Icon name="pencil-simple" /> button to access a field's basic and advanced settings to edit them
- Click on the **Add another field** buttons to create a new field for the selected content-type
- Click on the <Icon name="dots-six-vertical" classes="ph-bold"/> button and drag and drop any field to reorder the content-type's fields
- Click on the <Icon name="trash" /> button to delete a field

:::caution
Editing a field allows renaming it. However, keep in mind that regarding the database, renaming a field means creating a whole new field and deleting the former one. Although nothing is deleted from the database, the data that was associated with the former field name will not be accessible from the admin panel of your application anymore.
:::

### Configuring content-types fields {#configuring-fields-content-type}

Content-types are composed of one or several fields. Each field is designed to contain specific kind of data, filled up in the Content Manager (see [Creating & Writing content](/cms/features/content-manager#creating--writing-content)).

In the <Icon name="layout" /> Content-type Builder, fields can be added at the creation of a new content-type or component, or afterward when a content-type or component is edited or updated.

:::note
Depending on what content-type or component is being created or edited, not all fields -including components and dynamic zones- are always available.
:::

<ThemedImage
alt="Fields selection"
sources={{
    light: '/img/assets/content-type-builder/fields-selection.png',
    dark: '/img/assets/content-type-builder/fields-selection_DARK.png',
  }}
/>

#### <img width="28" src="/img/assets/icons/v5/ctb_text.svg" /> Text {#text}

The Text field displays a textbox that can contain small text. This field can be used for titles, descriptions, etc.

<Tabs>

<TabItem value="base" label="Basic settings">

| Setting name | Instructions                                                                                                                 |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Name         | Write the name of the Text field.                                                                                            |
| Type         | Choose between _Short text_ (255 characters maximum) and _Long text_, to allow more or less space to fill up the Text field. |

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name                       | Instructions                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default value                      | Write the default value of the Text field.                                                                                                            |
| RegExp pattern                     | Write a regular expression to make sure the value of the Text field matches a specific format.                                                        |
| Private field                      | Tick to make the field private and prevent it from being found via the API.                                                                           |
| Enable localization for this field | (if [Internationalization](/cms/features/internationalization) is enabled for the content-type) Allow the field to have a different value per locale. |
| Required field                     | Tick to prevent creating or saving an entry if the field is not filled in.                                                                            |
| Unique field                       | Tick to prevent another field to be identical to this one.                                                                                            |
| Maximum length                     | Tick to define a maximum number of characters allowed.                                                                                                |
| Minimum length                     | Tick to define a minimum number of characters allowed.                                                                                                |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>

#### <img width="28" src="/img/assets/icons/v5/ctb_richtextblocks.svg" /> Rich Text (Blocks) {#rich-text-blocks}

The Rich Text (Blocks) field displays an editor with live rendering and various options to manage rich text. This field can be used for long written content, even including images and code.

<Tabs>

<TabItem value="base" label="Basic settings">

| Setting name | Instructions                                    |
| ------------ | ----------------------------------------------- |
| Name         | Write the name of the Rich Text (Blocks) field. |

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name                       | Instructions                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Private field                      | Tick to make the field private and prevent it from being found via the API.                                                                           |
| Required field                     | Tick to prevent creating or saving an entry if the field is not filled in.                                                                            |
| Enable localization for this field | (if [Internationalization](/cms/features/internationalization) is enabled for the content-type) Allow the field to have a different value per locale. |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>

:::strapi React renderer
If using the Blocks editor, we recommend that you also use the <ExternalLink to="https://github.com/strapi/blocks-react-renderer" text="Strapi Blocks React Renderer"/> to easily render the content in a React frontend.
:::

#### <img width="28" src="/img/assets/icons/v5/ctb_number.svg" /> Number {#number}

The Number field displays a field for any kind of number: integer, decimal and float.

<Tabs>

<TabItem value="base" label="Basic settings">

| Setting name  | Instructions                                                    |
| ------------- | --------------------------------------------------------------- |
| Name          | Write the name of the Number field.                             |
| Number format | Choose between _integer_, _big integer_, _decimal_ and _float_. |

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name                       | Instructions                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default value                      | Write the default value of the Number field.                                                                                                          |
| Private field                      | Tick to make the field private and prevent it from being found via the API.                                                                           |
| Enable localization for this field | (if [Internationalization](/cms/features/internationalization) is enabled for the content-type) Allow the field to have a different value per locale. |
| Required field                     | Tick to prevent creating or saving an entry if the field is not filled in.                                                                            |
| Unique field                       | Tick to prevent another field to be identical to this one.                                                                                            |
| Maximum value                      | Tick to define a maximum value allowed.                                                                                                               |
| Minimum value                      | Tick to define a minimum value allowed.                                                                                                               |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>

#### <img width="28" src="/img/assets/icons/v5/ctb_date.svg" /> Date {#date}

The Date field can display a date (year, month, day), time (hour, minute, second) or datetime (year, month, day, hour, minute, and second) picker.

<Tabs>

<TabItem value="base" label="Basic settings">

| Setting name | Instructions                                 |
| ------------ | -------------------------------------------- |
| Name         | Write the name of the Date field.            |
| Type         | Choose between _date_, _datetime_ and _time_ |

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name                       | Instructions                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default value                      | Write the default value of the Date field.                                                                                                            |
| Private field                      | Tick to make the field private and prevent it from being found via the API.                                                                           |
| Enable localization for this field | (if [Internationalization](/cms/features/internationalization) is enabled for the content-type) Allow the field to have a different value per locale. |
| Required field                     | Tick to prevent creating or saving an entry if the field is not filled in.                                                                            |
| Unique field                       | Tick to prevent another field to be identical to this one.                                                                                            |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>
 
#### <img width="28" src="/img/assets/icons/v5/ctb_password.svg" /> Password

The Password field displays a password field that is encrypted.

<Tabs>

<TabItem value="base" label="Basic settings">

| Setting name | Instructions                          |
| ------------ | ------------------------------------- |
| Name         | Write the name of the Password field. |

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name                       | Instructions                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default value                      | Write the default value of the Password field.                                                                                                        |
| Private field                      | Tick to make the field private and prevent it from being found via the API.                                                                           |
| Enable localization for this field | (if [Internationalization](/cms/features/internationalization) is enabled for the content-type) Allow the field to have a different value per locale. |
| Required field                     | Tick to prevent creating or saving an entry if the field is not filled in.                                                                            |
| Maximum length                     | Tick to define a maximum number of characters allowed.                                                                                                |
| Minimum length                     | Tick to define a minimum number of characters allowed.                                                                                                |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>

#### <img width="28" src="/img/assets/icons/v5/ctb_media.svg" /> Media {#media}

The Media field allows to choose one or more media files (e.g. image, video) from those uploaded in the Media Library of the application.

<Tabs>

<TabItem value="base" label="Basic settings">

| Setting name | Instructions                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------------- |
| Name         | Write the name of the Media field.                                                                                  |
| Type         | Choose between _Multiple media_ to allow multiple media uploads, and _Single media_ to only allow one media upload. |

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name                       | Instructions                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Select allowed types of media      | Click on the drop-down list to untick media types not allowed for this field.                                                                         |
| Private field                      | Tick to make the field private and prevent it from being found via the API.                                                                           |
| Enable localization for this field | (if [Internationalization](/cms/features/internationalization) is enabled for the content-type) Allow the field to have a different value per locale. |
| Required field                     | Tick to prevent creating or saving an entry if the field is not filled in.                                                                            |
| Unique field                       | Tick to prevent another field to be identical to this one.                                                                                            |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>

#### <img width="28" src="/img/assets/icons/v5/ctb_relation.svg" /> Relation {#relation}

The Relation field allows to establish a relation with another content-type, that must be a collection type.

There are 6 different types of relations:

- <img width="25" src="/img/assets/icons/v5/ctb_relation_oneway.svg" /> One way: Content-type A _has one_ Content-type B
- <img width="25" src="/img/assets/icons/v5/ctb_relation_1to1.svg" /> One-to-one: Content-type A _has and belong to one_ Content-type B
- <img width="25" src="/img/assets/icons/v5/ctb_relation_1tomany.svg" /> One-to-many: Content-type A _belongs to many_ Content-type B
- <img width="25" src="/img/assets/icons/v5/ctb_relation_manyto1.svg" /> Many-to-one: Content-type B _has many_ Content-type A
- <img width="25" src="/img/assets/icons/v5/ctb_relation_manytomany.svg" /> Many-to-many: Content-type A _has and belongs to many_ Content-type B
- <img width="25" src="/img/assets/icons/v5/ctb_relation_manyway.svg" /> Many way: Content-type A _has many_ Content-type B

:::info Multi relations and single relations
Relations where at least one side can reference several entries are called multi relations. In the Content-type Builder, this includes one-to-many, many-to-one, many-to-many, and many-way relations. These relations appear as multi-select fields in the Content Manager and return arrays from the REST, GraphQL, and Document Service APIs; while single relations (one-way and one-to-one relations) return a single linked entry (see [Managing relations with API requests](/cms/api/rest/relations) for more information).
:::

<Tabs>

<TabItem value="base" label="Basic settings">

Configuring the basic settings of the Relation field consists in choosing with which existing content-type the relation should be established and the kind of relation. The edition window of the Relation field displays 2 grey boxes, each representing one of the content-types in relation. Between the grey boxes are displayed all possible relation types.

1. Click on the 2nd grey box to define the content-type B. It must be an already created collection type.
2. Click on the icon representing the relation to establish between the content-types.
3. Choose the _Field name_ of the content-type A, meaning the name that will be used for the field in the content-type A.
4. (optional if disabled by the relation type) Choose the _Field name_ of the content-type B.

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name  | Instructions                                                                |
| ------------- | --------------------------------------------------------------------------- |
| Private field | Tick to make the field private and prevent it from being found via the API. |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>

:::tip Modeling nested page hierarchies
To model a navigable tree of pages:

1. Add a `Page` collection type with a "Slug" (UID) and (optionally) an "Order" (Integer) field to control sibling ordering.
2. Create a Relation field from `Page` to `Page` and choose _Many-to-one_ so each page can set its "Parent page". Strapi automatically provides the inverse "Children pages" relation.
3. When reading data, populate `children` recursively to load the tree. Keep the recursion depth small to avoid large responses.

<details>
<summary>Example</summary>
```json title="Populate nested children for a page tree"
{
  populate: {
    children: {
      fields: ['title', 'slug'],
      populate: {
        children: {
          fields: ['title', 'slug'],
        },
      },
    },
  },
}
```
</details>

The same populate pattern works with GraphQL or the Document Service API (see [Understanding populate guide](/cms/api/rest/guides/understanding-populate#populate-several-levels-deep-for-specific-relations)).
:::

#### <img width="28" src="/img/assets/icons/v5/ctb_boolean.svg" /> Boolean {#boolean}

The Boolean field displays a toggle button to manage boolean values (e.g. Yes or No, 1 or 0, True or False).

<Tabs>

<TabItem value="base" label="Basic settings">

| Setting name | Instructions                         |
| ------------ | ------------------------------------ |
| Name         | Write the name of the Boolean field. |

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name                       | Instructions                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default value                      | Choose the default value of the Boolean field: _true_, _null_ or _false_.                                                                             |
| Private field                      | Tick to make the field private and prevent it from being found via the API.                                                                           |
| Enable localization for this field | (if [Internationalization](/cms/features/internationalization) is enabled for the content-type) Allow the field to have a different value per locale. |
| Required field                     | Tick to prevent creating or saving an entry if the field is not filled in.                                                                            |
| Unique field                       | Tick to prevent another field to be identical to this one.                                                                                            |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>

#### <img width="28" src="/img/assets/icons/v5/ctb_json.svg" /> JSON {#json}

The JSON field allows to configure data in a JSON format, to store JSON objects or arrays.

<Tabs>

<TabItem value="base" label="Basic settings">

| Setting name | Instructions                      |
| ------------ | --------------------------------- |
| Name         | Write the name of the JSON field. |

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name                       | Instructions                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Private field                      | Tick to make the field private and prevent it from being found via the API.                                                                           |
| Enable localization for this field | (if [Internationalization](/cms/features/internationalization) is enabled for the content-type) Allow the field to have a different value per locale. |
| Required field                     | Tick to prevent creating or saving an entry if the field is not filled in.                                                                            |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>

#### <img width="28" src="/img/assets/icons/v5/ctb_email.svg" /> Email {#email}

The Email field displays an email address field with format validation to ensure the email address is valid.

<Tabs>

<TabItem value="base" label="Basic settings">

| Setting name | Instructions                       |
| ------------ | ---------------------------------- |
| Name         | Write the name of the Email field. |

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name                       | Instructions                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default value                      | Write the default value of the Email field.                                                                                                           |
| Private field                      | Tick to make the field private and prevent it from being found via the API.                                                                           |
| Enable localization for this field | (if [Internationalization](/cms/features/internationalization) is enabled for the content-type) Allow the field to have a different value per locale. |
| Required field                     | Tick to prevent creating or saving an entry if the field is not filled in.                                                                            |
| Unique field                       | Tick to prevent another field to be identical to this one.                                                                                            |
| Maximum length                     | Tick to define a maximum number of characters allowed.                                                                                                |
| Minimum length                     | Tick to define a minimum number of characters allowed.                                                                                                |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>

#### <img width="28" src="/img/assets/icons/v5/ctb_password.svg" /> Password {#password}

The Password field displays a password field that is encrypted.

<Tabs>

<TabItem value="base" label="Basic settings">

| Setting name | Instructions                          |
| ------------ | ------------------------------------- |
| Name         | Write the name of the Password field. |

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name                       | Instructions                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default value                      | Write the default value of the Password field.                                                                                                        |
| Private field                      | Tick to make the field private and prevent it from being found via the API.                                                                           |
| Enable localization for this field | (if [Internationalization](/cms/features/internationalization) is enabled for the content-type) Allow the field to have a different value per locale. |
| Required field                     | Tick to prevent creating or saving an entry if the field is not filled in.                                                                            |
| Maximum length                     | Tick to define a maximum number of characters allowed.                                                                                                |
| Minimum length                     | Tick to define a minimum number of characters allowed.                                                                                                |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>

#### <img width="28" src="/img/assets/icons/v5/ctb_enum.svg" /> Enumeration {#enum}

The Enumeration field allows to configure a list of values displayed in a drop-down list.

<Tabs>

<TabItem value="base" label="Basic settings">

| Setting name | Instructions                                       |
| ------------ | -------------------------------------------------- |
| Name         | Write the name of the Enumeration field.           |
| Values       | Write the values of the enumeration, one per line. |

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name                       | Instructions                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default value                      | Choose the default value of the Enumeration field.                                                                                                    |
| Name override for GraphQL          | Write a custom GraphQL schema type to override the default one for the field.                                                                         |
| Private field                      | Tick to make the field private and prevent it from being found via the API.                                                                           |
| Enable localization for this field | (if [Internationalization](/cms/features/internationalization) is enabled for the content-type) Allow the field to have a different value per locale. |
| Required field                     | Tick to prevent creating or saving an entry if the field is not filled in.                                                                            |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>

:::caution
Enumeration values should always have an alphabetical character preceding any number as it could otherwise cause the server to crash without notice when the GraphQL plugin is installed.
:::

#### <img width="28" src="/img/assets/icons/v5/ctb_uid.svg" /> UID {#uid}

The UID field displays a field that sets a unique identifier, optionally based on an existing other field from the same content-type.

<Tabs>

<TabItem value="base" label="Basic settings">

| Setting name   | Instructions                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Name           | Write the name of the UID field. It must not contain special characters or spaces.                     |
| Attached field | Choose what existing field to attach to the UID field. Choose _None_ to not attach any specific field. |

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name   | Instructions                                                                |
| -------------- | --------------------------------------------------------------------------- |
| Default value  | Write the default value of the UID field.                                   |
| Private field  | Tick to make the field private and prevent it from being found via the API. |
| Required field | Tick to prevent creating or saving an entry if the field is not filled in.  |
| Maximum length | Tick to define a maximum number of characters allowed.                      |
| Minimum length | Tick to define a minimum number of characters allowed.                      |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>

:::tip
The UID field can be used to create a slug based on the Attached field.
:::

#### <img width="28" src="/img/assets/icons/v5/ctb_richtext.svg" /> Rich Text (Markdown) {#rich-text-markdown}

The Rich Text (Markdown) field displays an editor with basic formatting options to manage rich text written in Markdown. This field can be used for long written content.

<Tabs>

<TabItem value="base" label="Basic settings">

| Setting name | Instructions                                      |
| ------------ | ------------------------------------------------- |
| Name         | Write the name of the Rich Text (Markdown) field. |

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name                       | Instructions                                                                                                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Default value                      | Write the default value of the Rich Text field.                                                                                                              |
| Private field                      | Tick to make the field private and prevent it from being found via the API.                                                                                  |
| Enable localization for this field | (if [Internationalization plugin](/cms/features/internationalization) is enabled for the content-type) Allow the field to have a different value per locale. |
| Required field                     | Tick to prevent creating or saving an entry if the field is not filled in.                                                                                   |
| Maximum length                     | Tick to define a maximum number of characters allowed.                                                                                                       |
| Minimum length                     | Tick to define a minimum number of characters allowed.                                                                                                       |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>

#### <img width="28" src="/img/assets/icons/v5/ctb_component.svg" /> Components {#components}

Components are a combination of several fields. Components allow to create reusable sets of fields, that can be quickly added to content-types, dynamic zones but also nested into other components.

When configuring a component through the Content-type Builder, it is possible to either:

- create a new component by clicking on _Create a new component_ (see [Creating a new component](#new-component)),
- or use an existing one by clicking on _Use an existing component_.

<Tabs>

<TabItem value="base" label="Basic settings">

| Setting name       | Instructions                                                                                                                                                                        |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name               | Write the name of the component for the content-type.                                                                                                                               |
| Select a component | When using an existing component only - Select from the drop-down list an existing component.                                                                                       |
| Type               | Choose between _Repeatable component_ to be able to use several times the component for the content-type, or _Single component_ to limit to only one time the use of the component. |

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name                       | Instructions                                                                                                                                               |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Required field                     | Tick to prevent creating or saving an entry if the field is not filled in.                                                                                 |
| Private field                      | Tick to make the field private and prevent it from being found via the API.                                                                                |
| Maximum value                      | For repeatable components only - Tick to define a maximum number of characters allowed.                                                                    |
| Minimum value                      | For repeatable components only - Tick to define a minimum number of characters allowed.                                                                    |
| Enable localization for this field | (if [Internationalization](/cms/features/internationalization) is enabled for the content-type) Allow the component to be translated per available locale. |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>

#### <img width="28" src="/img/assets/icons/v5/ctb_dz.svg" /> Dynamic zones {#dynamiczones}

Dynamic zones are a combination of components that can be added to content-types. They allow a flexible content structure as once in the Content Manager, administrators have the choice of composing and rearranging the components of the dynamic zone how they want.

<Tabs>

<TabItem value="base" label="Basic settings">

| Setting name | Instructions                                             |
| ------------ | -------------------------------------------------------- |
| Name         | Write the name of the dynamic zone for the content-type. |

</TabItem>

<TabItem value="advanced" label="Advanced settings">

| Setting name                       | Instructions                                                                                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Required field                     | Tick to prevent creating or saving an entry if the field is not filled in.                                                                                    |
| Maximum value                      | Tick to define a maximum number of characters allowed.                                                                                                        |
| Minimum value                      | Tick to define a minimum number of characters allowed.                                                                                                        |
| Enable localization for this field | (if [Internationalization](/cms/features/internationalization) is enabled for the content-type) Allow the dynamic zone to be translated per available locale. |

</TabItem>

<TabItem value="condition" label="Condition">

<ConditionalFields components={props.components} />

</TabItem>

</Tabs>

After configuring the settings of the dynamic zone, its components must be configured as well. It is possible to either choose an existing component or create a new one.

:::caution
When using dynamic zones, different components cannot have the same field name with different types (or with enumeration fields, different values).
:::

#### Custom fields

[Custom fields](/cms/features/custom-fields) are a way to extend Strapi’s capabilities by adding new types of fields to content-types or components. Once installed (see [Marketplace](/cms/plugins/installing-plugins-via-marketplace) documentation), custom fields are listed in the _Custom_ tab when selecting a field for a content-type.

Each custom field type can have basic and advanced settings. The <ExternalLink to="https://market.strapi.io/plugins?categories=Custom+fields" text="Marketplace"/> lists available custom fields, and hosts dedicated documentation for each custom field, including specific settings.

### Deleting content-types

Content types and components can be deleted through the Content-type Builder. Deleting a content-type automatically deletes all entries from the Content Manager that were based on that content-type. The same goes for the deletion of a component, which is automatically deleted from every content-type or entry where it was used.

1. In the <Icon name="layout" /> Content-type Builder sub navigation, click on the name of the content-type or component to delete.
2. In the edition interface of the chosen content-type or component, click on the <Icon name="pencil-simple" /> **Edit** button on the right side of the content-type's or component's name.
3. In the edition window, click on the **Delete** button.
4. In the confirmation window, confirm the deletion.
5. Click on the **Save** button in the Content-type Builder sub navigation.

:::caution
Deleting a content-type only deletes what was created and available from the Content-type Builder, and by extent from the admin panel of your Strapi application. All the data that was created based on that content-type is however kept in the database. For more information, please refer to the related <ExternalLink to="https://github.com/strapi/strapi/issues/1114" text="GitHub issue"/>.
:::

<ThemedImage
alt="Deletion of content type in Content-type Builder"
sources={{
    light: '/img/assets/content-type-builder/new_CTB_deletion.png',
    dark: '/img/assets/content-type-builder/new_CTB_deletion_DARK.png',
  }}
/>

---

title: Custom Fields
description: Learn how you can use custom fields to extend Strapi's content-types capabilities.
displayed_sidebar: cmsSidebar
toc_max_heading_level: 5
canonicalUrl: https://docs.strapi.io/cms/development/custom-fields.html
tags:

- admin panel
- Components
- Content-type Builder
- Content Manager
- custom fields
- register function

---

import CustomFieldRequiresPlugin from '/docs/snippets/custom-field-requires-plugin.md'

# Custom Fields

<Tldr>
Custom Fields extend Strapi with new field types that behave like native fields in the Content‑type Builder and Content Manager. Instructions in this documentation cover building or installing fields via plugins and registering them programmatically.
</Tldr>

Custom fields extend Strapi’s capabilities by adding new types of fields to content-types and components. Once created or added to Strapi via plugins, custom fields can be used in the Content-Type Builder and Content Manager just like built-in fields.

<IdentityCard>
<IdentityCardItem icon="credit-card" title="Plan">Free feature</IdentityCardItem>
<IdentityCardItem icon="user" title="Role & permission">None</IdentityCardItem>
<IdentityCardItem icon="toggle-right" title="Activation">Available and activated by default</IdentityCardItem>
<IdentityCardItem icon="desktop" title="Environment">Available in both Development & Production environment</IdentityCardItem>
</IdentityCard>

## Configuration

Ready-made custom fields can be found on the [Marketplace](https://market.strapi.io/plugins?categories=Custom+fields). Once installed these, no other configuration is required, and you can start using them (see [usage](#usage)).

You can also develop your own custom field.

### Developing your own custom field

Though the recommended way to add a custom field is through creating a plugin, app-specific custom fields can also be registered within the global `register` [function](/cms/configurations/functions) found in `src/index` and `src/admin/app` files.

:::note Current limitations

- Custom fields can only be shared and distributed on the Marketplace using plugins.
- Custom fields cannot add new data types to Strapi and must use existing, built-in Strapi data types described in the [models' attributes](/cms/backend-customization/models#model-attributes) documentation.
- You also cannot modify an existing data type.
- Special data types unique to Strapi, such as relation, media, component, or dynamic zone data types, cannot be used in custom fields.
  :::

:::prerequisites
<CustomFieldRequiresPlugin components={props.components} />
:::

Custom field plugins include both a server and admin panel part. The custom field must be registered in both parts before it is usable in Strapi's admin panel.

#### Registering a custom field on the server

Strapi's server needs to be aware of all the custom fields to ensure that an attribute using a custom field is valid.

The `strapi.customFields` object exposes a `register()` method on the `Strapi` instance. This method is used to register custom fields on the server during the plugin's server [register lifecycle](/cms/plugins-development/server-api#register).

`strapi.customFields.register()` registers one or several custom field(s) on the server by passing an object (or an array of objects) with some parameters.

<details>
<summary>Parameters available to register the custom field on the server:</summary>

| Parameter                         | Description                                                                                                                                                                                                                                                   | Type     |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `name`                            | The name of the custom field                                                                                                                                                                                                                                  | `String` |
| `plugin`<br/><br/>(_optional_)    | The name of the plugin creating the custom fields<br/><br/>❗️ If defined, the `pluginId` value on the admin panel registration must have the same value (see [Registering a custom field in the admin panel](#registering-a-custom-field-in-the-admin-panel)) | `String` |
| `type`                            | The data type the custom field will use                                                                                                                                                                                                                       | `String` |
| `inputSize`<br/><br/>(_optional_) | Parameters to define the width of a custom field's input in the admin panel                                                                                                                                                                                   | `Object` |

The optional `inputSize` object, when specified, must contain all of the following parameters:

| Parameter     | Description                                                                                                                                               | Type      |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| `default`     | The default size in columns that the input field will occupy in the 12-column grid in the admin panel.<br/>The value can either be `4`, `6`, `8` or `12`. | `Integer` |
| `isResizable` | Whether the input can be resized or not                                                                                                                   | `Boolean` |

</details>

**Example: Registering an example "color" custom field on the server:**

In the following example, the `color-picker` plugin was created using the CLI generator (see [plugins development](/cms/plugins-development/developing-plugins)):

<Tabs groupId="js-ts">
<TabItem value="js" label="JavaScript">

```js title="/src/plugins/color-picker/server/register.js"
module.exports = ({ strapi }) => {
  strapi.customFields.register({
    name: 'color',
    plugin: 'color-picker',
    type: 'string',
    inputSize: {
      // optional
      default: 4,
      isResizable: true,
    },
  });
};
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```ts title="/src/plugins/color-picker/server/register.ts"
export default ({ strapi }: { strapi: any }) => {
  strapi.customFields.register({
    name: 'color',
    plugin: 'color-picker',
    type: 'string',
    inputSize: {
      // optional
      default: 4,
      isResizable: true,
    },
  });
};
```

</TabItem>
</Tabs>

The custom field could also be declared directly within the `strapi-server.js` file if you didn't have the plugin code scaffolded by the CLI generator:

<Tabs groupId="js-ts">
<TabItem value="js" label="JavaScript">

```js title="/src/plugins/color-picker/strapi-server.js"
module.exports = {
  register({ strapi }) {
    strapi.customFields.register({
      name: 'color',
      plugin: 'color-picker',
      type: 'text',
      inputSize: {
        // optional
        default: 4,
        isResizable: true,
      },
    });
  },
};
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```ts title="/src/plugins/color-picker/strapi-server.ts"
export default {
  register({ strapi }: { strapi: any }) {
    strapi.customFields.register({
      name: 'color',
      plugin: 'color-picker',
      type: 'text',
      inputSize: {
        // optional
        default: 4,
        isResizable: true,
      },
    });
  },
};
```

</TabItem>
</Tabs>

#### Registering a custom field in the admin panel

:::prerequisites
<CustomFieldRequiresPlugin components={props.components} />
:::

Custom fields must be registered in Strapi's admin panel to be available in the Content-type Builder and the Content Manager.

The `app.customFields` object exposes a `register()` method on the `StrapiApp` instance. This method is used to register custom fields in the admin panel during the plugin's admin [register lifecycle](/cms/plugins-development/admin-panel-api#register).

`app.customFields.register()` registers one or several custom field(s) in the admin panel by passing an object (or an array of objects) with some parameters.

<details>
<summary>Parameters available to register the custom field on the server:</summary>

| Parameter                        | Description                                                                                                                                                                                                                             | Type                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `name`                           | Name of the custom field                                                                                                                                                                                                                | `String`                                                                    |
| `pluginId`<br/><br/>(_optional_) | Name of the plugin creating the custom field<br/><br/>❗️ If defined, the `plugin` value on the server registration must have the same value (see [Registering a custom field on the server](#registering-a-custom-field-on-the-server)) | `String`                                                                    |
| `type`                           | Existing Strapi data type the custom field will use<br/><br/>❗️ Relations, media, components, or dynamic zones cannot be used.                                                                                                          | `String`                                                                    |
| `icon`<br/><br/>(_optional_)     | Icon for the custom field                                                                                                                                                                                                               | `React.ComponentType`                                                       |
| `intlLabel`                      | Translation for the name                                                                                                                                                                                                                | <ExternalLink to="https://formatjs.io/docs/react-intl/" text="IntlObject"/> |
| `intlDescription`                | Translation for the description                                                                                                                                                                                                         | <ExternalLink to="https://formatjs.io/docs/react-intl/" text="IntlObject"/> |
| `components`                     | Components needed to display the custom field in the Content Manager (see [components](#components))                                                                                                                                    |
| `options`<br/><br/>(_optional_)  | Options to be used by the Content-type Builder (see [options](#options))                                                                                                                                                                | `Object`                                                                    |

</details>

**Example: Registering an example "color" custom field in the admin panel:**

In the following example, the `color-picker` plugin was created using the CLI generator (see [plugins development](/cms/plugins-development/developing-plugins.md)):

<Tabs groupId="js-ts">
<TabItem value="js" label="JavaScript">

```jsx title="/src/plugins/color-picker/admin/src/index.js"
import ColorPickerIcon from './components/ColorPicker/ColorPickerIcon';

export default {
  register(app) {
    // ... app.addMenuLink() goes here
    // ... app.registerPlugin() goes here

    app.customFields.register({
      name: 'color',
      pluginId: 'color-picker', // the custom field is created by a color-picker plugin
      type: 'string', // the color will be stored as a string
      intlLabel: {
        id: 'color-picker.color.label',
        defaultMessage: 'Color',
      },
      intlDescription: {
        id: 'color-picker.color.description',
        defaultMessage: 'Select any color',
      },
      icon: ColorPickerIcon, // don't forget to create/import your icon component
      components: {
        Input: async () =>
          import('./components/Input').then((module) => ({
            default: module.Input,
          })),
      },
      options: {
        // declare options here
      },
    });
  },

  // ... bootstrap() goes here
};
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```ts title="/src/plugins/color-picker/admin/src/index.ts"
import ColorPickerIcon from './components/ColorPicker/ColorPickerIcon';

export default {
  register(app) {
    // ... app.addMenuLink() goes here
    // ... app.registerPlugin() goes here

    app.customFields.register({
      name: 'color',
      pluginId: 'color-picker', // the custom field is created by a color-picker plugin
      type: 'string', // the color will be stored as a string
      intlLabel: {
        id: 'color-picker.color.label',
        defaultMessage: 'Color',
      },
      intlDescription: {
        id: 'color-picker.color.description',
        defaultMessage: 'Select any color',
      },
      icon: ColorPickerIcon, // don't forget to create/import your icon component
      components: {
        Input: async () =>
          import('./components/Input').then((module) => ({
            default: module.Input,
          })),
      },
      options: {
        // declare options here
      },
    });
  },

  // ... bootstrap() goes here
};
```

</TabItem>
</Tabs>

##### Components

`app.customFields.register()` must pass a `components` object with an `Input` React component to use in the Content Manager's edit view.

**Example: Registering an Input component:**

In the following example, the `color-picker` plugin was created using the CLI generator (see [plugins development](/cms/plugins-development/developing-plugins.md)):

<Tabs groupId="js-ts">
<TabItem value="js" label="JavaScript">

```jsx title="/src/plugins/color-picker/admin/src/index.js"
export default {
  register(app) {
    app.customFields.register({
      // …
      components: {
        Input: async () =>
          import('./components/Input').then((module) => ({
            default: module.Input,
          })),
      },
      // …
    });
  },
};
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```jsx title="/src/plugins/color-picker/admin/src/index.js"
export default {
  register(app) {
    app.customFields.register({
      // …
      components: {
        Input: async () =>
          import('./components/Input').then((module) => ({
            default: module.Input,
          })),
      },
      // …
    });
  },
};
```

</TabItem>
</Tabs>

<details>
<summary>Props passed to the custom field <code>Input</code> component:</summary>

| Prop             | Description                                                                                                                                                                                     | Type                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `attribute`      | The attribute object with custom field's underlying Strapi type and options                                                                                                                     | `{ type: String, customField: String }`                                     |
| `description`    | The field description set in [configure the view](/cms/features/content-manager#edit-view-settings)                                                                                             | <ExternalLink to="https://formatjs.io/docs/react-intl/" text="IntlObject"/> |
| `placeholder`    | The field placeholder set in [configure the view](/cms/features/content-manager#edit-view-settings)                                                                                             | <ExternalLink to="https://formatjs.io/docs/react-intl/" text="IntlObject"/> |
| `hint`           | The field description set in [configure the view](/cms/features/content-manager#edit-view-settings) along with min/max [validation requirements](/cms/backend-customization/models#validations) | `String`                                                                    |
| `name`           | The field name set in the content-type builder                                                                                                                                                  | `String`                                                                    |
| `intlLabel`      | The field name set in the content-type builder or configure the view                                                                                                                            | <ExternalLink to="https://formatjs.io/docs/react-intl/" text="IntlObject"/> |
| `onChange`       | The handler for the input change event. The `name` argument references the field name. The `type` argument references the underlying Strapi type                                                | `({ target: { name: String value: unknown type: String } }) => void`        |
| `contentTypeUID` | The content-type the field belongs to                                                                                                                                                           | `String`                                                                    |
| `type`           | The custom field uid, for example `plugin::color-picker.color`                                                                                                                                  | `String`                                                                    |
| `value`          | The input value the underlying Strapi type expects                                                                                                                                              | `unknown`                                                                   |
| `required`       | Whether or not the field is required                                                                                                                                                            | `boolean`                                                                   |
| `error`          | Error received after validation                                                                                                                                                                 | <ExternalLink to="https://formatjs.io/docs/react-intl/" text="IntlObject"/> |
| `disabled`       | Whether or not the input is disabled                                                                                                                                                            | `boolean`                                                                   |

As of Strapi v4.13.0, fields in the Content Manager can be auto-focussed via the `URLSearchParam` `field`. It's recommended that your input component is wrapped in React's <ExternalLink to="https://react.dev/reference/react/forwardRef" text="`forwardRef`"/> method; you should pass the corresponding `ref` to the `input` element.

<br/>
</details>

**Example: A custom text input**

In the following example we're providing a custom text input that is controlled. All inputs should be controlled otherwise their data will not be submitted on save.

<Tabs groupId="js-ts">
<TabItem value="js" label="JavaScript">

```jsx title="/src/plugins/<plugin-name>/admin/src/components/Input.js"
import * as React from 'react';

import { useIntl } from 'react-intl';

const Input = React.forwardRef((props, ref) => {
  const { attribute, disabled, intlLabel, name, onChange, required, value } = props; // these are just some of the props passed by the content-manager

  const { formatMessage } = useIntl();

  const handleChange = (e) => {
    onChange({
      target: { name, type: attribute.type, value: e.currentTarget.value },
    });
  };

  return (
    <label>
      {formatMessage(intlLabel)}
      <input ref={ref} name={name} disabled={disabled} value={value} required={required} onChange={handleChange} />
    </label>
  );
});

export default Input;
```

</TabItem>
<TabItem value="ts" label="TypeScript">

```tsx title="/src/plugins/<plugin-name>/admin/src/components/Input.ts"
import * as React from 'react';

import { useIntl } from 'react-intl';

const Input = React.forwardRef((props, ref) => {
  const { attribute, disabled, intlLabel, name, onChange, required, value } = props; // these are just some of the props passed by the content-manager

  const { formatMessage } = useIntl();

  const handleChange = (e) => {
    onChange({
      target: { name, type: attribute.type, value: e.currentTarget.value },
    });
  };

  return (
    <label>
      {formatMessage(intlLabel)}
      <input ref={ref} name={name} disabled={disabled} value={value} required={required} onChange={handleChange} />
    </label>
  );
});

export default Input;
```

</TabItem>
</Tabs>

:::tip
For a more detailed view of the props provided to the customFields and how they can be used check out the <ExternalLink to="https://github.com/strapi/strapi/blob/main/packages/plugins/color-picker/admin/src/components/ColorPickerInput.tsx#L80-L95" text="ColorPickerInput file"/> in the Strapi codebase.
:::

##### Options

`app.customFields.register()` can pass an additional `options` object. with the following parameters:

<details>
<summary>Parameters passed to the custom field <code>options</code> object:</summary>

| Options parameter | Description                                                                                                                                                        | Type                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| `base`            | Settings available in the _Base settings_ tab of the field in the Content-type Builder                                                                             | `Object` or `Array of Objects` |
| `advanced`        | Settings available in the _Advanced settings_ tab of the field in the Content-type Builder                                                                         | `Object` or `Array of Objects` |
| `validator`       | Validator function returning an object, used to sanitize input. Uses a <ExternalLink to="https://github.com/jquense/yup/tree/pre-v1" text="`yup` schema object"/>. | `Function`                     |

Both `base` and `advanced` settings accept an object or an array of objects, each object being a settings section. Each settings section could include:

- a `sectionTitle` to declare the title of the section as an <ExternalLink to="https://formatjs.io/docs/react-intl/" text="IntlObject"/>
- and a list of `items` as an array of objects.

Each object in the `items` array can contain the following parameters:

| Items parameter | Description                                                        | Type                                                                          |
| --------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `name`          | Label of the input.<br/>Must use the `options.settingName` format. | `String`                                                                      |
| `description`   | Description of the input to use in the Content-type Builder        | `String`                                                                      |
| `intlLabel`     | Translation for the label of the input                             | <ExternalLink to="https://formatjs.io/docs/react-intl/" text="`IntlObject`"/> |
| `type`          | Type of the input (e.g., `select`, `checkbox`)                     | `String`                                                                      |

</details>

**Example: Declaring options for an example "color" custom field:**

In the following example, the `color-picker` plugin was created using the CLI generator (see [plugins development](/cms/plugins-development/developing-plugins.md)):

<Tabs groupId="js-ts">
<TabItem value="js" label="JavaScript">

```jsx title="/src/plugins/color-picker/admin/src/index.js"
// imports go here (ColorPickerIcon, pluginId, yup package…)

export default {
  register(app) {
    // ... app.addMenuLink() goes here
    // ... app.registerPlugin() goes here
    app.customFields.register({
      // …
      options: {
        base: [
          /*
          Declare settings to be added to the "Base settings" section
          of the field in the Content-Type Builder
        */
          {
            sectionTitle: {
              // Add a "Format" settings section
              id: 'color-picker.color.section.format',
              defaultMessage: 'Format',
            },
            items: [
              // Add settings items to the section
              {
                /*
                Add a "Color format" dropdown
                to choose between 2 different format options
                for the color value: hexadecimal or RGBA
              */
                intlLabel: {
                  id: 'color-picker.color.format.label',
                  defaultMessage: 'Color format',
                },
                name: 'options.format',
                type: 'select',
                value: 'hex', // option selected by default
                options: [
                  // List all available "Color format" options
                  {
                    key: 'hex',
                    defaultValue: 'hex',
                    value: 'hex',
                    metadatas: {
                      intlLabel: {
                        id: 'color-picker.color.format.hex',
                        defaultMessage: 'Hexadecimal',
                      },
                    },
                  },
                  {
                    key: 'rgba',
                    value: 'rgba',
                    metadatas: {
                      intlLabel: {
                        id: 'color-picker.color.format.rgba',
                        defaultMessage: 'RGBA',
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
        advanced: [
          /*
          Declare settings to be added to the "Advanced settings" section
          of the field in the Content-Type Builder
        */
        ],
        validator: (args) => ({
          format: yup.string().required({
            id: 'options.color-picker.format.error',
            defaultMessage: 'The color format is required',
          }),
        }),
      },
    });
  },
};
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```tsx title="/src/plugins/color-picker/admin/src/index.ts"
// imports go here (ColorPickerIcon, pluginId, yup package…)

export default {
  register(app) {
    // ... app.addMenuLink() goes here
    // ... app.registerPlugin() goes here
    app.customFields.register({
      // …
      options: {
        base: [
          /*
          Declare settings to be added to the "Base settings" section
          of the field in the Content-Type Builder
        */
          {
            sectionTitle: {
              // Add a "Format" settings section
              id: 'color-picker.color.section.format',
              defaultMessage: 'Format',
            },
            items: [
              // Add settings items to the section
              {
                /*
                Add a "Color format" dropdown
                to choose between 2 different format options
                for the color value: hexadecimal or RGBA
              */
                intlLabel: {
                  id: 'color-picker.color.format.label',
                  defaultMessage: 'Color format',
                },
                name: 'options.format',
                type: 'select',
                value: 'hex', // option selected by default
                options: [
                  // List all available "Color format" options
                  {
                    key: 'hex',
                    defaultValue: 'hex',
                    value: 'hex',
                    metadatas: {
                      intlLabel: {
                        id: 'color-picker.color.format.hex',
                        defaultMessage: 'Hexadecimal',
                      },
                    },
                  },
                  {
                    key: 'rgba',
                    value: 'rgba',
                    metadatas: {
                      intlLabel: {
                        id: 'color-picker.color.format.rgba',
                        defaultMessage: 'RGBA',
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
        advanced: [
          /*
          Declare settings to be added to the "Advanced settings" section
          of the field in the Content-Type Builder
        */
        ],
        validator: (args) => ({
          format: yup.string().required({
            id: 'options.color-picker.format.error',
            defaultMessage: 'The color format is required',
          }),
        }),
      },
    });
  },
};
```

</TabItem>
</Tabs>

<!-- TODO: replace these tip and links by proper documentation of all the possible shapes and parameters for `options` -->

:::tip
The Strapi codebase gives an example of how settings objects can be described: check the <ExternalLink to="https://github.com/strapi/strapi/blob/main/packages/core/content-type-builder/admin/src/components/FormModal/attributes/baseForm.ts" text="`baseForm.ts`"/> file for the `base` settings and the <ExternalLink to="https://github.com/strapi/strapi/blob/main/packages/core/content-type-builder/admin/src/components/FormModal/attributes/advancedForm.ts" text="`advancedForm.ts`"/> file for the `advanced` settings. The base form lists the settings items inline but the advanced form gets the items from an <ExternalLink to="https://github.com/strapi/strapi/blob/main/packages/core/content-type-builder/admin/src/components/FormModal/attributes/attributeOptions.js" text="`attributeOptions.js`"/> file.
:::

## Usage

<br/>

### In the admin panel

Custom fields can be added to Strapi either by installing them from the [Marketplace](/cms/plugins/installing-plugins-via-marketplace) or by creating your own.

Once added to Strapi, custom fields can be added to any content type. Custom fields are listed in the _Custom_ tab when selecting a field for a content-type.

<!-- TODO: add screenshot of content-type builder with custom fields tab here -->

Each custom field type can have basic and advanced settings. The <ExternalLink to="https://market.strapi.io/plugins?categories=Custom+fields" text="Marketplace"/> lists available custom fields, and hosts dedicated documentation for each custom field, including specific settings.

### In the code

Once created and used, custom fields are defined like any other attribute in the model's schema.

Custom fields are explicitly defined in the [attributes](/cms/backend-customization/models#model-attributes) of a model with `type: customField`.

As compared to how other types of models are defined, custom fields' attributes also show the following specificities:

- Custom field have a `customField` attribute. Its value acts as a unique identifier to indicate which registered custom field should be used, and follows one of these 2 formats:

  | Format                           | Origin                                                                                                                                                  |
  | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin::plugin-name.field-name` | The custom field was created through a plugin                                                                                                           |
  | `global::field-name`             | The custom field is specific to the current Strapi application and was created directly within the `register` [function](/cms/configurations/functions) |

- Custom fields can have additional parameters depending on what has been defined when registering the custom field (see [server registration](#registering-a-custom-field-on-the-server) and [admin panel registration](#registering-a-custom-field-in-the-admin-panel)).

**Example: A simple `color` custom field model definition:**

```json title="/src/api/[apiName]/[content-type-name]/content-types/schema.json"
{
  // …
  "attributes": {
    "color": {
      // name of the custom field defined in the Content-Type Builder
      "type": "customField",
      "customField": "plugin::color-picker.color",
      "options": {
        "format": "hex"
      }
    }
  }
  // …
}
```

---

title: Customization
description: Learn more about Strapi 5 customization possibilities
displayed_sidebar: cmsSidebar
pagination_next: cms/backend-customization
tags:

- admin panel
- admin panel customization
- backend customization
- backend server
- concepts
- Content-type Builder
- Content Manager
- introduction

---

# Customization

Strapi includes 2 main components:

- The back-end part of Strapi is a **server** that receives requests and handles them to return responses that can surface the data you built and saved through the Content-Type Builder and Content Manager. The backend server is described in more details in the [Backend Customization introduction](/cms/backend-customization). Most of the parts of the backend server can be customized.

- The front-end, user-facing part of Strapi is called the **admin panel**. The admin panel is the graphical user interface (GUI) that you use to build a content structure, create and manage content, and perform various other actions that can be managed by built-in or 3rd-party plugins. Some parts of the admin panel can be customized.

From a bigger picture, this is how Strapi integrates in a typical, generic setup: Strapi includes 2 parts, a back-end server and an admin panel, and interact with a database (which stores data) and an external, front-end application that displays your data. Both parts of Strapi can be customized to some extent.

<MermaidWithFallback
    chartFile="/diagrams/customization.mmd"
    fallbackImage="/img/assets/diagrams/customization.png"
    fallbackImageDark="/img/assets/diagrams/customization_DARK.png"
    alt="Customization diagram"
/>

<br />

Click on any of the following cards to learn more about customization possibilities:

<CustomDocCardsWrapper>
<CustomDocCard emoji="" title="Back-end customization" description="Customize the backend server (routes, policies, middlewares, controllers, services, and models)." link="/cms/backend-customization" />
<CustomDocCard emoji="" title="Admin panel customization" description="Customize the admin panel (logos, themes, menu, translations, and more)." link="/cms/admin-panel-customization" />
</CustomDocCardsWrapper>

:::info
Customizing the database or the external, front-end application are outside of the scope of the present documentation section.

- You can learn more about databases usage with Strapi by reading the installation documentation, which lists [supported databases](/cms/installation/cli#preparing-the-installation), and the configuration documentation, which describes how to [configure a database](/cms/configurations/database) with your project.
- You can learn more about how external front-end applications can interact with Strapi by reading the Strapi's <ExternalLink to="https://strapi.io/integrations" text="integration pages"/>.
  :::

---

title: Lifecycle functions
displayed_sidebar: cmsSidebar
description: Strapi includes lifecycle functions (e.g. register, bootstrap and destroy) that control the flow of your application.
tags:

- additional configuration
- asynchronous function
- bootstrap function
- configuration
- destroy function
- lifecycle function
- register function
- synchronous function

---

# Functions

<Tldr>
`src/index` hosts global register, bootstrap, and destroy functions to run logic during application lifecycle.
</Tldr>

<div className="dont_hide_secondary_bar">

The `./src/index.js` file (or `./src/index.ts` file in a [TypeScript-based](/cms/typescript) project) includes global [register](#register), [bootstrap](#bootstrap) and [destroy](#destroy) functions that can be used to add dynamic and logic-based configurations.

The functions can be synchronous, asynchronous, or return a promise.

<MermaidWithFallback
    chartFile="/diagrams/functions.mmd"
    fallbackImage="/img/assets/diagrams/functions.png"
    fallbackImageDark="/img/assets/diagrams/functions_DARK.png"
    alt="Lifecycle functions diagram"
/>

</div>

## Available modes

Lifecycle functions support 3 execution patterns/modes so you can align them with the dependencies they manage. Strapi waits for each function to finish, whether it returns normally, resolves an `async` function, or resolves a promise, before moving on with startup or shutdown.

Return values aren't used by Strapi, so the functions should resolve (or return) only when their setup or cleanup is complete and throw or reject to signal a failure.

### Synchronous

Synchronous functions run logic that completes immediately without awaiting other asynchronous tasks.

<Tabs groupId="js-ts">

<TabItem value="javascript" label="JavaScript">

```js
module.exports = {
  register({ strapi }) {
    strapi.log.info('Registering static configuration');
  },
  bootstrap({ strapi }) {
    strapi.log.info('Bootstrap finished without awaiting tasks');
  },
  destroy({ strapi }) {
    strapi.log.info('Server shutdown started');
  },
};
```

</TabItem>

<TabItem value="typescript" label="TypeScript">

```ts
export default {
  register({ strapi }) {
    strapi.log.info('Registering static configuration');
  },
  bootstrap({ strapi }) {
    strapi.log.info('Bootstrap finished without awaiting tasks');
  },
  destroy({ strapi }) {
    strapi.log.info('Server shutdown started');
  },
};
```

</TabItem>

</Tabs>

### Asynchronous

Asynchronous functions use the `async` keyword to `await` tasks such as API calls or database queries before Strapi continues.

<Tabs groupId="js-ts">

<TabItem value="javascript" label="JavaScript">

```js
module.exports = {
  async register({ strapi }) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    strapi.log.info('Async register finished after a short delay');
  },
  async bootstrap({ strapi }) {
    const { results: articles } = await strapi.documents('api::article.article').findMany({
      filters: { publishedAt: { $notNull: true } },
      fields: ['id'],
    });
    strapi.log.info(`Indexed ${articles.length} published articles`);
  },
  async destroy({ strapi }) {
    await strapi.documents('api::temporary-cache.temporary-cache').deleteMany({
      filters: {},
    });
  },
};
```

</TabItem>

<TabItem value="typescript" label="TypeScript">

```ts
export default {
  async register({ strapi }) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    strapi.log.info('Async register finished after a short delay');
  },
  async bootstrap({ strapi }) {
    const { results: articles } = await strapi.documents('api::article.article').findMany({
      filters: { publishedAt: { $notNull: true } },
      fields: ['id'],
    });
    strapi.log.info(`Indexed ${articles.length} published articles`);
  },
  async destroy({ strapi }) {
    await strapi.documents('api::temporary-cache.temporary-cache').deleteMany({
      filters: {},
    });
  },
};
```

</TabItem>

</Tabs>

### Returning a promise

Promise-returning functions hand back a promise so Strapi can wait for its resolution before continuing.

<Tabs groupId="js-ts">

<TabItem value="javascript" label="JavaScript">

```js
module.exports = {
  register({ strapi }) {
    return new Promise((resolve) => {
      strapi.log.info('Registering with a delayed startup task');
      setTimeout(resolve, 200);
    });
  },
  bootstrap({ strapi }) {
    return new Promise((resolve, reject) => {
      strapi
        .documents('api::category.category')
        .findMany({ filters: { slug: 'general' }, pageSize: 1 })
        .then(({ results }) => {
          if (results.length === 0) {
            return strapi.documents('api::category.category').create({
              data: { name: 'General', slug: 'general' },
            });
          }

          return results[0];
        })
        .then(() => {
          strapi.log.info('Ensured default category exists');
          resolve();
        })
        .catch(reject);
    });
  },
  destroy({ strapi }) {
    return new Promise((resolve, reject) => {
      strapi
        .documents('api::temporary-cache.temporary-cache')
        .deleteMany({ filters: {} })
        .then(() => {
          strapi.log.info('Cleared temporary cache before shutdown');
          resolve();
        })
        .catch(reject);
    });
  },
};
```

</TabItem>

<TabItem value="typescript" label="TypeScript">

```ts
export default {
  register({ strapi }) {
    return new Promise((resolve) => {
      strapi.log.info('Registering with a delayed startup task');
      setTimeout(resolve, 200);
    });
  },
  bootstrap({ strapi }) {
    return new Promise((resolve, reject) => {
      strapi
        .documents('api::category.category')
        .findMany({ filters: { slug: 'general' }, pageSize: 1 })
        .then(({ results }) => {
          if (results.length === 0) {
            return strapi.documents('api::category.category').create({
              data: { name: 'General', slug: 'general' },
            });
          }

          return results[0];
        })
        .then(() => {
          strapi.log.info('Ensured default category exists');
          resolve();
        })
        .catch(reject);
    });
  },
  destroy({ strapi }) {
    return new Promise((resolve, reject) => {
      strapi
        .documents('api::temporary-cache.temporary-cache')
        .deleteMany({ filters: {} })
        .then(() => {
          strapi.log.info('Cleared temporary cache before shutdown');
          resolve();
        })
        .catch(reject);
    });
  },
};
```

</TabItem>

</Tabs>

## Lifecycle functions

Lifecycle functions let you place code at specific phases of Strapi's startup and shutdown.

- The `register()` function is for configuration-time setup before services start.
- The `bootstrap()` function is for initialization that needs Strapi's APIs.
- The `destroy()` function is for teardown when the application stops.

### Register

The `register` lifecycle function, found in `./src/index.js` (or in `./src/index.ts`), is an asynchronous function that runs before the application is initialized.

`register()` is the very first thing that happens when a Strapi application is starting. This happens _before_ any setup process and you don't have any access to database, routes, policies, or any other backend server elements within the `register()` function.

The `register()` function can be used to:

- [extend plugins](/cms/plugins-development/plugins-extension#extending-a-plugins-interface)
- extend [content-types](/cms/backend-customization/models) programmatically
- load some [environment variables](/cms/configurations/environment)
- register a [custom field](/cms/features/custom-fields) that would be used only by the current Strapi application,
- register a [custom provider for the Users & Permissions plugin](/cms/configurations/users-and-permissions-providers/new-provider-guide).

More specifically, typical use-cases for `register()` include front-load security tasks such as loading secrets, rotating API keys, or registering authentication providers before the app finishes initializing.

<Tabs groupId="js-ts">

<TabItem value="javascript" label="JavaScript">

```js
module.exports = {
  register({ strapi }) {
    strapi.customFields.register({
      name: 'color',
      plugin: 'my-color-picker',
      type: 'string',
    });
  },
};
```

</TabItem>

<TabItem value="typescript" label="TypeScript">

```ts
export default {
  register({ strapi }) {
    strapi.customFields.register({
      name: 'color',
      plugin: 'my-color-picker',
      type: 'string',
    });
  },
};
```

</TabItem>

</Tabs>

### Bootstrap

The `bootstrap` lifecycle function, found in `./src/index.js` (or in `./src/index.ts`), is called at every server start.

`bootstrap()` is run _before_ the back-end server starts but _after_ the Strapi application has setup, so you have access to anything from the `strapi` object.

The `bootstrap` function can be used to:

- create an admin user if there isn't one
- fill the database with some necessary data
- declare custom conditions for the [Role-Based Access Control (RBAC)](/cms/configurations/guides/rbac) feature

More specifically, a typical use-case for `bootstrap()` is supporting editorial workflows. For example by seeding starter content, attaching webhooks, or scheduling cron jobs at startup.

:::tip
You can run `yarn strapi console` (or `npm run strapi console`) in the terminal and interact with the `strapi` object.
:::

<Tabs groupId="js-ts">

<TabItem value="javascript" label="JavaScript">

```js
module.exports = {
  async bootstrap({ strapi }) {
    const { results } = await strapi
      .documents('api::category.category')
      .findMany({ filters: { slug: 'general' }, pageSize: 1 });

    if (results.length === 0) {
      await strapi.documents('api::category.category').create({
        data: { name: 'General', slug: 'general' },
      });
      strapi.log.info('Created default category');
    }
  },
};
```

</TabItem>

<TabItem value="typescript" label="TypeScript">

```ts
export default {
  async bootstrap({ strapi }) {
    const { results } = await strapi
      .documents('api::category.category')
      .findMany({ filters: { slug: 'general' }, pageSize: 1 });

    if (results.length === 0) {
      await strapi.documents('api::category.category').create({
        data: { name: 'General', slug: 'general' },
      });
      strapi.log.info('Created default category');
    }
  },
};
```

</TabItem>

</Tabs>

### Destroy

The `destroy` function, found in `./src/index.js` (or in `./src/index.ts`), is an asynchronous function that runs before the application gets shut down.

The `destroy` function can be used to gracefully:

- stop [services](/cms/backend-customization/services) that are running
- [clean up plugin actions](/cms/plugins-development/server-api#destroy) (e.g. close connections, remove listeners, etc.)

More specifically, a typical use-case for `destroy()` is to handle operational clean-up, such as closing database or queue connections and removing listeners so the application can shut down cleanly.

<Tabs groupId="js-ts">

<TabItem value="javascript" label="JavaScript">

```js
let heartbeat;

module.exports = {
  async bootstrap({ strapi }) {
    heartbeat = setInterval(() => {
      strapi.log.debug('Heartbeat interval running');
    }, 60_000);
  },

  async destroy() {
    clearInterval(heartbeat);
  },
};
```

</TabItem>

<TabItem value="typescript" label="TypeScript">

```ts
let heartbeat: ReturnType<typeof setInterval>;

export default {
  async bootstrap({ strapi }) {
    heartbeat = setInterval(() => {
      strapi.log.debug('Heartbeat interval running');
    }, 60_000);
  },

  async destroy() {
    clearInterval(heartbeat);
  },
};
```

</TabItem>

</Tabs>

## Usage

<br/>

### Combined usage

All 3 lifecycle functions can be put together to configure custom behavior during application startup and shutdown.

1. Decide when your logic should run.
   - Add initialization-only tasks (e.g. registering a custom field or provider) in `register()`.
   - Add startup tasks that need full Strapi access (e.g. seeding or attaching webhooks) in `bootstrap()`.
   - Add cleanup logic (e.g. closing external connections) in `destroy()`.
2. Place the code in `src/index.js|ts`. Keep `register()` lean because it runs before Strapi is fully set up.
3. Restart Strapi to confirm each lifecycle executes in sequence.

```ts title="src/index.ts"
let cronJobKey: string | undefined;

export default {
  register({ strapi }) {
    strapi.customFields.register({
      name: 'color',
      type: 'string',
      plugin: 'color-picker',
    });
  },

  async bootstrap({ strapi }) {
    cronJobKey = 'log-reminders';

    strapi.cron.add({
      [cronJobKey]: {
        rule: '0 */6 * * *', // every 6 hours
        job: async () => {
          strapi.log.info('Remember to review new content in the admin panel.');
        },
      },
    });
  },

  async destroy({ strapi }) {
    if (cronJobKey) {
      strapi.cron.remove(cronJobKey);
    }
  },
};
```

:::strapi Additional information
You might find additional information in <ExternalLink to="https://strapi.io/blog/how-to-use-register-function-to-customize-your-strapi-app" text="this blog article"/> about registering lifecycle functions.
:::

---

title: Routes
description: Strapi routes handle requests to your content and are auto-generated for your content-types. Routes can be customized according to your needs.
displayed_sidebar: cmsSidebar
tags:

- backend customization
- backend server
- controllers
- core routers
- custom routers
- ctx
- middlewares
- policies
- public routes
- REST API
- routes

---

# Routes

<Tldr>
Routes map incoming URLs to controllers and ship pre-generated for each content type. This documentation shows how to add or customize core and custom routers and attach policies or middlewares for extra control.
</Tldr>

Requests sent to Strapi on any URL are handled by routes. By default, Strapi generates routes for all the content-types (see [REST API documentation](/cms/api/rest)). Routes can be [added](#implementation) and configured:

- with [policies](#policies), which are a way to block access to a route,
- and with [middlewares](#middlewares), which are a way to control and change the request flow and the request itself.

Once a route exists, reaching it executes some code handled by a controller (see [controllers documentation](/cms/backend-customization/controllers)). To view all existing routes and their hierarchal order, you can run `yarn strapi routes:list` (see [CLI reference](/cms/cli)).

:::tip
If you only customize the default controller actions (`find`, `findOne`, `create`, `update`, or `delete`) that Strapi generates for a content-type, you can leave the router as-is. Those core routes already target the same handler names and will run your new controller logic. Add or edit a route only when you need a brand-new HTTP path/method or want to expose a custom controller action.
:::

<figure style={{width: '100%', margin: '0'}}>
  <img src="/img/assets/backend-customization/diagram-routes.png" alt="Simplified Strapi backend diagram with routes highlighted" />
  <em><figcaption style={{fontSize: '12px'}}>The diagram represents a simplified version of how a request travels through the Strapi back end, with routes highlighted. The backend customization introduction page includes a complete, <a href="/cms/backend-customization#interactive-diagram">interactive diagram</a>.</figcaption></em>
</figure>

## Implementation

Implementing a new route consists in defining it in a router file within the `./src/api/[apiName]/routes` folder (see [project structure](/cms/project-structure)).

There are 2 different router file structures, depending on the use case:

- configuring [core routers](#configuring-core-routers)
- or creating [custom routers](#creating-custom-routers).

### Configuring core routers

Core routers (i.e. `find`, `findOne`, `create`, `update`, and `delete`) correspond to [default routes](/cms/api/rest#endpoints) automatically created by Strapi when a new [content-type](/cms/backend-customization/models#model-creation) is created.

Strapi provides a `createCoreRouter` factory function that automatically generates the core routers and allows:

- passing in configuration options to each router
- and disabling some core routers to [create custom ones](#creating-custom-routers).

A core router file is a JavaScript file exporting the result of a call to `createCoreRouter` with the following parameters:

| Parameter | Description                                                                                                                        | Type     |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------- | --- |
| `prefix`  | Allows passing in a custom prefix to add to all routers for this model (e.g. `/test`)                                              | `String` |
| `only`    | Core routes that will only be loaded<br /><br/>Anything not in this array is ignored.                                              | `Array`  | --> |
| `except`  | Core routes that should not be loaded<br/><br />This is functionally the opposite of the `only` parameter.                         | `Array`  |
| `config`  | Configuration to handle [policies](#policies), [middlewares](#middlewares) and [public availability](#public-routes) for the route | `Object` |

<br/>

<Tabs groupId="js-ts">

<TabItem value="js" label="JavaScript">

```js title="./src/api/[apiName]/routes/[routerName].js (e.g './src/api/restaurant/routes/restaurant.js')"
const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::restaurant.restaurant', {
  prefix: '',
  only: ['find', 'findOne'],
  except: [],
  config: {
    find: {
      auth: false,
      policies: [],
      middlewares: [],
    },
    findOne: {},
    create: {},
    update: {},
    delete: {},
  },
});
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```ts title="./src/api/[apiName]/routes/[routerName].ts (e.g './src/api/restaurant/routes/restaurant.ts')"
import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::restaurant.restaurant', {
  prefix: '',
  only: ['find', 'findOne'],
  except: [],
  config: {
    find: {
      auth: false,
      policies: [],
      middlewares: [],
    },
    findOne: {},
    create: {},
    update: {},
    delete: {},
  },
});
```

</TabItem>
</Tabs>

<br />

Generic implementation example:

<Tabs groupId="js-ts">
<TabItem value="js" label="JavaScript">

```js title="./src/api/restaurant/routes/restaurant.js"
const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::restaurant.restaurant', {
  only: ['find'],
  config: {
    find: {
      auth: false,
      policies: [],
      middlewares: [],
    },
  },
});
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```ts title="./src/api/restaurant/routes/restaurant.ts"
import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::restaurant.restaurant', {
  only: ['find'],
  config: {
    find: {
      auth: false,
      policies: [],
      middlewares: [],
    },
  },
});
```

</TabItem>
</Tabs>

This only allows a `GET` request on the `/restaurants` path from the core `find` [controller](/cms/backend-customization/controllers) without authentication. When you reference custom controller actions in custom routers, prefer the fully‑qualified `api::<api-name>.<controllerName>.<actionName>` form for clarity (e.g., `api::restaurant.restaurant.review`).

### Creating custom routers

Creating custom routers consists in creating a file that exports an array of objects, each object being a route with the following parameters:

| Parameter                      | Description                                                                                                                                                                                                                                                      | Type     |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `method`                       | Method associated to the route (i.e. `GET`, `POST`, `PUT`, `DELETE` or `PATCH`)                                                                                                                                                                                  | `String` |
| `path`                         | Path to reach, starting with a forward-leading slash (e.g. `/articles`)                                                                                                                                                                                          | `String` |
| `handler`                      | Function to execute when the route is reached.<br/>Use the fully-qualified syntax `api::api-name.controllerName.actionName` (or `plugin::plugin-name.controllerName.actionName`). The short `<controllerName>.<actionName>` form for legacy projects also works. | `String` |
| `config`<br /><br />_Optional_ | Configuration to handle [policies](#policies), [middlewares](#middlewares) and [public availability](#public-routes) for the route<br/><br/>                                                                                                                     | `Object` |

<br/>

Dynamic routes can be created using parameters and regular expressions. These parameters will be exposed in the `ctx.params` object. For more details, please refer to the <ExternalLink to="https://github.com/pillarjs/path-to-regexp" text="PathToRegex"/> documentation.

:::caution
Routes files are loaded in alphabetical order. To load custom routes before core routes, make sure to name custom routes appropriately (e.g. `01-custom-routes.js` and `02-core-routes.js`).
:::

:::info Controller handler naming reference
The `handler` string acts as a pointer to the controller action that should run for the route. Strapi supports the following formats:

- API controllers: `api::<api-name>.<controllerName>.<actionName>` (e.g. `api::restaurant.restaurant.exampleAction`). The `<controllerName>` comes from the controller filename inside `./src/api/<api-name>/controllers/`.
- Plugin controllers: `plugin::<plugin-name>.<controllerName>.<actionName>` when the controller lives in a plugin.

For backwards compatibility, Strapi also accepts a short `<controllerName>.<actionName>` string for API controllers, but using the fully-qualified form makes the route more explicit and avoids naming collisions across APIs and plugins.
:::

<details>

<summary>Example of a custom router using URL parameters and regular expressions for routes</summary>

In the following example, the custom routes file name is prefixed with `01-` to make sure the route is reached before the core routes.

<Tabs groupId="js-ts">

<TabItem value="js" label="JavaScript">

```js title="./src/api/restaurant/routes/01-custom-restaurant.js"
/** @type {import('@strapi/strapi').Core.RouterConfig} */
const config = {
  type: 'content-api',
  routes: [
    {
      // Path defined with an URL parameter
      method: 'POST',
      path: '/restaurants/:id/review',
      handler: 'api::restaurant.restaurant.review',
    },
    {
      // Path defined with a regular expression
      method: 'GET',
      path: '/restaurants/:category([a-z]+)', // Only match when the URL parameter is composed of lowercase letters
      handler: 'api::restaurant.restaurant.findByCategory',
    },
  ],
};

module.exports = config;
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```js title="./src/api/restaurant/routes/01-custom-restaurant.ts"
import type { Core } from '@strapi/strapi';

const config: Core.RouterConfig = {
  type: 'content-api',
  routes: [
    { // Path defined with a URL parameter
      method: 'GET',
      path: '/restaurants/:category/:id',
      handler: 'api::restaurant.restaurant.findOneByCategory',
    },
    { // Path defined with a regular expression
      method: 'GET',
      path: '/restaurants/:region(\\d{2}|\\d{3})/:id', // Only match when the first parameter contains 2 or 3 digits.
      handler: 'api::restaurant.restaurant.findOneByRegion',
    }
  ]
}

export default config
```

</TabItem>
</Tabs>

</details>

## Configuration

Both [core routers](#configuring-core-routers) and [custom routers](#creating-custom-routers) have the same configuration options. The routes configuration is defined in a `config` object that can be used to handle [policies](#policies) and [middlewares](#middlewares) or to [make the route public](#public-routes).

### Policies

[Policies](/cms/backend-customization/policies) can be added to a route configuration:

- by pointing to a policy registered in `./src/policies`, with or without passing a custom configuration
- or by declaring the policy implementation directly, as a function that takes `policyContext` to extend <ExternalLink to="https://koajs.com/#context" text="Koa's context"/> (`ctx`) and the `strapi` instance as arguments (see [policies documentation](/cms/backend-customization/routes))

<Tabs groupId="core-vs-custom-router">

<TabItem value="core-router" label="Core router policy">

<Tabs  groupId="js-ts">
<TabItem value="js" label="JavaScript">

```js title="./src/api/restaurant/routes/restaurant.js"
const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::restaurant.restaurant', {
  config: {
    find: {
      policies: [
        // point to a registered policy
        'policy-name',

        // point to a registered policy with some custom configuration
        { name: 'policy-name', config: {} },

        // pass a policy implementation directly
        (policyContext, config, { strapi }) => {
          return true;
        },
      ],
    },
  },
});
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```js title="./src/api/restaurant/routes/restaurant.ts"
import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::restaurant.restaurant', {
  config: {
    find: {
      policies: [
        // point to a registered policy
        'policy-name',

        // point to a registered policy with some custom configuration
        { name: 'policy-name', config: {} },

        // pass a policy implementation directly
        (policyContext, config, { strapi }) => {
          return true;
        },
      ],
    },
  },
});
```

</TabItem>
</Tabs>

</TabItem>

<TabItem value="custom-router" label="Custom router policy">

<Tabs groupId="js-ts">
<TabItem value="js" label="JavaScript">

```js title="./src/api/restaurant/routes/custom-restaurant.js"
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/articles/customRoute',
      handler: 'api::api-name.controllerName.functionName', // or 'plugin::plugin-name.controllerName.functionName' for a plugin-specific controller
      config: {
        policies: [
          // point to a registered policy
          'policy-name',

          // point to a registered policy with some custom configuration
          { name: 'policy-name', config: {} },

          // pass a policy implementation directly
          (policyContext, config, { strapi }) => {
            return true;
          },
        ],
      },
    },
  ],
};
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```js title="./src/api/restaurant/routes/custom-restaurant.ts"
export default {
  routes: [
    {
      method: 'GET',
      path: '/articles/customRoute',
      handler: 'api::api-name.controllerName.functionName', // or 'plugin::plugin-name.controllerName.functionName' for a plugin-specific controller
      config: {
        policies: [
          // point to a registered policy
          'policy-name',

          // point to a registered policy with some custom configuration
          { name: 'policy-name', config: {} },

          // pass a policy implementation directly
          (policyContext, config, { strapi }) => {
            return true;
          },
        ],
      },
    },
  ],
};
```

</TabItem>
</Tabs>

</TabItem>

</Tabs>

### Middlewares

[Middlewares](/cms/backend-customization/middlewares) can be added to a route configuration:

- by pointing to a middleware registered in `./src/middlewares`, with or without passing a custom configuration
- or by declaring the middleware implementation directly, as a function that takes <ExternalLink to="https://koajs.com/#context" text="Koa's context"/> (`ctx`) and the `strapi` instance as arguments:

<Tabs groupId="core-vs-custom-router">

<TabItem value="core-router" label="Core router middleware">

<Tabs groupId="js-ts">

<TabItem value="js" label="JavaScript">

```js title="./src/api/restaurant/routes/restaurant.js"
const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::restaurant.restaurant', {
  config: {
    find: {
      middlewares: [
        // point to a registered middleware
        'middleware-name',

        // point to a registered middleware with some custom configuration
        { name: 'middleware-name', config: {} },

        // pass a middleware implementation directly
        (ctx, next) => {
          return next();
        },
      ],
    },
  },
});
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```js title="./src/api/restaurant/routes/restaurant.ts"
import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::restaurant.restaurant', {
  config: {
    find: {
      middlewares: [
        // point to a registered middleware
        'middleware-name',

        // point to a registered middleware with some custom configuration
        { name: 'middleware-name', config: {} },

        // pass a middleware implementation directly
        (ctx, next) => {
          return next();
        },
      ],
    },
  },
});
```

</TabItem>
</Tabs>

</TabItem>

<TabItem value="custom-router" label="Custom router middleware">

<Tabs groupId="js-ts">

<TabItem value="js" label="JavaScript">

```js title="./src/api/restaurant/routes/custom-restaurant.js"
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/articles/customRoute',
      handler: 'api::api-name.controllerName.functionName', // or 'plugin::plugin-name.controllerName.functionName' for a plugin-specific controller
      config: {
        middlewares: [
          // point to a registered middleware
          'middleware-name',

          // point to a registered middleware with some custom configuration
          { name: 'middleware-name', config: {} },

          // pass a middleware implementation directly
          (ctx, next) => {
            return next();
          },
        ],
      },
    },
  ],
};
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```js title="./src/api/restaurant/routes/custom-restaurant.ts"
export default {
  routes: [
    {
      method: 'GET',
      path: '/articles/customRoute',
      handler: 'api::api-name.controllerName.functionName', // or 'plugin::plugin-name.controllerName.functionName' for a plugin-specific controller
      config: {
        middlewares: [
          // point to a registered middleware
          'middleware-name',

          // point to a registered middleware with some custom configuration
          { name: 'middleware-name', config: {} },

          // pass a middleware implementation directly
          (ctx, next) => {
            return next();
          },
        ],
      },
    },
  ],
};
```

</TabItem>
</Tabs>

</TabItem>

</Tabs>

### Public routes

By default, routes are protected by Strapi's authentication system, which is based on [API tokens](/cms/features/api-tokens) or on the use of the [Users & Permissions plugin](/cms/features/users-permissions).

In some scenarios, it can be useful to have a route publicly available and control the access outside of the normal Strapi authentication system. This can be achieved by setting the `auth` configuration parameter of a route to `false`:

<Tabs groupId="core-vs-custom-router">

<TabItem value="core-router" label="Core router with a public route">

<Tabs groupId="js-ts">

<TabItem value="js" label="JavaScript">

```js title="./src/api/restaurant/routes/restaurant.js"
const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::restaurant.restaurant', {
  config: {
    find: {
      auth: false,
    },
  },
});
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```js title="./src/api/restaurant/routes/restaurant.ts"
import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::restaurant.restaurant', {
  config: {
    find: {
      auth: false,
    },
  },
});
```

</TabItem>
</Tabs>

</TabItem>

<TabItem value="custom-router" label="Custom router with a public route">

<Tabs groupId="js-ts">

<TabItem value="js" label="JavaScript">

```js title="./src/api/restaurant/routes/custom-restaurant.js"
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/articles/customRoute',
      handler: 'api::api-name.controllerName.functionName', // or 'plugin::plugin-name.controllerName.functionName' for a plugin-specific controller
      config: {
        auth: false,
      },
    },
  ],
};
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```js title="./src/api/restaurant/routes/custom-restaurant.ts"
export default {
  routes: [
    {
      method: 'GET',
      path: '/articles/customRoute',
      handler: 'api::api-name.controllerName.functionName', // or 'plugin::plugin-name.controllerName.functionName' for a plugin-specific controller
      config: {
        auth: false,
      },
    },
  ],
};
```

</TabItem>
</Tabs>

</TabItem>

</Tabs>

---

title: Requests and Responses
description: Learn more about requests and responses for Strapi, the most popular headless CMS.
tags:

- backend customization
- backend server
- ctx
- REST API

---

# Requests and Responses

<Tldr>
Koa’s context (`ctx`) carries request info, state, and response data through every Strapi endpoint. This documentation details `ctx.request`, `ctx.state`, and `ctx.response`, plus a helper for accessing context anywhere.
</Tldr>

The Strapi back end server is based on <ExternalLink to="https://koajs.com/" text="Koa"/>. When you send requests through the [REST API](/cms/api/rest), a context object (`ctx`) is passed to every element of the Strapi back end (e.g., [policies](/cms/backend-customization/policies), [controllers](/cms/backend-customization/controllers), [services](/cms/backend-customization/services)).

`ctx` includes 3 main objects:

- [`ctx.request`](#ctxrequest) for information about the request sent by the client making an API request,
- [`ctx.state`](#ctxstate) for information about the state of the request within the Strapi back end,
- and [`ctx.response`](#ctxresponse) for information about the response that the server will return.

:::tip
The request's context can also be accessed from anywhere in the code with the [`strapi.requestContext` function](#accessing-the-request-context-anywhere).
:::

:::info
In addition to the concepts and parameters described in the following documentation, you might find additional information in the <ExternalLink to="http://koajs.com/#request" text="Koa request documentation"/>, <ExternalLink to="https://github.com/koajs/router/blob/master/API.md" text="Koa Router documentation"/> and <ExternalLink to="http://koajs.com/#response" text="Koa response documentation"/>.
:::

<figure style={{width: '100%', margin: '0'}}>
  <img src="/img/assets/backend-customization/diagram-requests-responses.png" alt="Simplified Strapi backend diagram with requests and responses highlighted" />
  <em><figcaption style={{fontSize: '12px'}}>The diagram represents a simplified version of how a request travels through the Strapi back end, with requests and responses highlighted. The backend customization introduction page includes a complete, <a href="/cms/backend-customization#interactive-diagram">interactive diagram</a>.</figcaption></em>
</figure>

## `ctx.request`

The `ctx.request` object contains the following parameters:

| Parameter                | Description                                                                                                                                                                                                                                                       | Type     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `ctx.request.body`       | Parsed version of the body.                                                                                                                                                                                                                                       | `Object` |
| `ctx.request.files`      | Files sent with the request.                                                                                                                                                                                                                                      | `Array`  |
| `ctx.request.headers`    | Headers sent with the request.                                                                                                                                                                                                                                    | `Object` |
| `ctx.request.host`       | Host part of the URL, including the port.                                                                                                                                                                                                                         | `String` |
| `ctx.request.hostname`   | Host part of the URL, excluding the port.                                                                                                                                                                                                                         | `String` |
| `ctx.request.href`       | Complete URL of the requested resource, including the protocol, domain, port (if specified), path, and query parameters.                                                                                                                                          | `String` |
| `ctx.request.ip`         | IP of the person sending the request.                                                                                                                                                                                                                             | `String` |
| `ctx.request.ips`        | When `X-Forwarded-For` is present and `app.proxy` is enabled, an array of IPs is returned, ordered from upstream to downstream. <br /><br />For example if the value were "client, proxy1, proxy2", you would receive the `["client", "proxy1", "proxy2"]` array. | `Array`  |
| `ctx.request.method`     | Request method (e.g., `GET`, `POST`).                                                                                                                                                                                                                             | `String` |
| `ctx.request.origin`     | URL part before the first `/`.                                                                                                                                                                                                                                    | `String` |
| `ctx.request.params`     | Parameters sent in the URL.<br /><br/>For example, if the internal URL is `/restaurants/:id`, whatever you replace `:id` in the real request becomes accessible through `ctx.request.params.id`.                                                                  | `Object` |
| `ctx.request.path`       | Path of the requested resource, excluding the query parameters.                                                                                                                                                                                                   | `String` |
| `ctx.request.protocol`   | Protocol being used (e.g., `https` or `http`).                                                                                                                                                                                                                    | `String` |
| `ctx.request.query`      | Strapi-specific [query parameters](#ctxrequestquery).                                                                                                                                                                                                             | `Object` |
| `ctx.request.subdomains` | Subdomains included in the URL.<br /><br />For example, if the domain is `tobi.ferrets.example.com`, the value is the following array: `["ferrets", "tobi"]`.                                                                                                     | `Array`  |
| `ctx.request.url`        | Path and query parameters of the requested resource, excluding the protocol, domain, and port.                                                                                                                                                                    | `String` |

<details>
<summary>Differences between protocol, origin, url, href, path, host, and hostname :</summary>

Given an API request sent to the `https://example.com:1337/api/restaurants?id=123` URL, here is what different parameters of the `ctx.request` object return:

| Parameter              | Returned value                                    |
| ---------------------- | ------------------------------------------------- |
| `ctx.request.href`     | `https://example.com:1337/api/restaurants?id=123` |
| `ctx.request.protocol` | `https`                                           |
| `ctx.request.host`     | `localhost:1337`                                  |
| `ctx.request.hostname` | `localhost`                                       |
| `ctx.request.origin`   | `https://example.com:1337`                        |
| `ctx.request.url`      | `/api/restaurants?id=123`                         |
| `ctx.request.path`     | `/api/restaurants`                                |

</details>

### `ctx.request.query`

`ctx.request` provides a `query` object that gives access to Strapi query parameters. The following table lists available parameters with a short description and a link to the relevant REST API documentation section (see [REST API parameters](/cms/api/rest/parameters) for more information):

| Parameter                            | Description                                                                                                            | Type                 |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | -------------------- |
| `ctx.request.query`<br />`ctx.query` | The whole query object.                                                                                                | `Object`             |
| `ctx.request.query.sort`             | Parameters to [sort the response](/cms/api/rest/sort-pagination.md#sorting)                                            | `String` or `Array`  |
| `ctx.request.query.filters`          | Parameters to [filter the response](/cms/api/rest/filters)                                                             | `Object`             |
| `ctx.request.query.populate`         | Parameters to [populate relations, components, or dynamic zones](/cms/api/rest/populate-select#population)             | `String` or `Object` |
| `ctx.request.query.fields`           | Parameters to [select only specific fields to return with the response](/cms/api/rest/populate-select#field-selection) | `Array`              |
| `ctx.request.query.pagination`       | Parameter to [page through entries](/cms/api/rest/sort-pagination.md#pagination)                                       | `Object`             |
| `ctx.request.query.publicationState` | Parameter to [select the Draft & Publish state](/cms/api/rest/status)                                                  | `String`             |
| `ctx.request.query.locale`           | Parameter to [select one or multiple locales](/cms/api/rest/locale)                                                    | `String` or `Array`  |

## `ctx.state`

The `ctx.state` object gives access to the state of the request within the Strapi back end, including specific values about the [user](#ctxstateuser), [authentication](#ctxstateauth), [route](#ctxstateroute):

| Parameter                   | Description                                                   | Type      |
| --------------------------- | ------------------------------------------------------------- | --------- |
| `ctx.state.isAuthenticated` | Returns whether the current user is authenticated in any way. | `Boolean` |

### `ctx.state.user`

The `ctx.state.user` object gives access to information about the user performing the request and includes the following parameters:

| Parameter             | Description                                         | Type     |
| --------------------- | --------------------------------------------------- | -------- |
| `ctx.state.user`      | User's information. Only one relation is populated. | `Object` |
| `ctx.state.user.role` | The user's role                                     | `Object` |

<!-- which type of "user" are we talking about here? a "U&P"-related user? -->

### `ctx.state.auth`

The `ctx.state.auth` object gives access to information related to the authentication and includes the following parameters:

| Parameter                      | Description                                                                                                                                                            | Type     |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `ctx.state.auth.strategy`      | Information about the currently used authentication strategy ([Users & Permissions plugin](/cms/features/users-permissions) or [API tokens](/cms/features/api-tokens)) | `Object` |
| `ctx.state.auth.strategy.name` | Name of the currently used strategy                                                                                                                                    | `String` |
| `ctx.state.auth.credentials`   | The user's credentials                                                                                                                                                 | `String` |

<!-- ? ctx.state.auth.strategy seems to include the authenticate and verify functions. should we document them somewhere? -->
<!-- ? not sure what credentials are used for ? -->

### `ctx.state.route`

The `ctx.state.route` object gives access to information related to the current route and includes the following parameters:

| Parameter                      | Description                                                                                   | Type     |
| ------------------------------ | --------------------------------------------------------------------------------------------- | -------- |
| `ctx.state.route.method`       | Method used to access the current route.                                                      | `String` |
| `ctx.state.route.path`         | Path of the current route.                                                                    | `String` |
| `ctx.state.route.config`       | Configuration information about the current route.                                            | `Object` |
| `ctx.state.route.handler`      | Handler (controller) of the current route.                                                    | `Object` |
| `ctx.state.route.info`         | Additional information about the current route, such as the apiName and the API request type. | `Object` |
| `ctx.state.route.info.apiName` | Name of the used API.                                                                         | `String` |
| `ctx.state.route.info.type`    | Type of the used API.                                                                         | `String` |

## `ctx.response`

The `ctx.response` object gives access to information related to the response that the server will return and includes the following parameters:

| Parameter                                                                             | Description                                                                                                                                                                                                                                                                                                                                                  | Type       |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| `ctx.response.body`                                                                   | Body of the response.                                                                                                                                                                                                                                                                                                                                        | `Any`      |
| `ctx.response.status`                                                                 | Status code of the response.                                                                                                                                                                                                                                                                                                                                 | `Integer`  |
| `ctx.response.message`                                                                | Status message of the response.<br/><br />By default, `response.message` is associated with `response.status`.                                                                                                                                                                                                                                               | `String`   |
| `ctx.response.header`<br />`ctx.response.headers`                                     | Header(s) sent with the response.                                                                                                                                                                                                                                                                                                                            | `Object`   |
| `ctx.response.length`                                                                 | <ExternalLink to="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Length" text="`Content-Length`"/> header value as a number when present, or deduces it from `ctx.body` when possible; otherwise, returns `undefined`.                                                                                                                    | `Integer`  |
| `ctx.response.redirect`<br />`ctx.response.redirect(url, [alt])`                      | Performs a `302` redirect to the URL. The string "back" is special-cased to provide Referrer support; when Referrer is not present, alt or "/" is used.<br /><br />Example: `ctx.response.redirect('back', '/index.html');`                                                                                                                                  | `Function` |
| `ctx.response.attachment`<br /><br />`ctx.response.attachment([filename], [options])` | Sets <ExternalLink to="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition" text="`Content-Disposition`"/> header to "attachment" to signal the client to prompt for download. Optionally specify the filename of the download and some <ExternalLink to="https://github.com/jshttp/content-disposition#options" text="options"/>. | `Function` |
| `ctx.response.type`                                                                   | <ExternalLink to="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type" text="`Content-Type`"/> header, void of parameters such as "charset".                                                                                                                                                                                              | `String`   |
| `ctx.response.lastModified`                                                           | <ExternalLink to="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Last-Modified" text="`Last-Modified`"/> header as a Date, if it exists.                                                                                                                                                                                                          | `DateTime` |
| `ctx.response.etag`                                                                   | Sets the <ExternalLink to="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag" text="`ETag`"/> of a response including the wrapped "s.<br/>There is no corresponding `response.etag` getter.                                                                                                                                                     | `String`   |

<!-- I don't understand what these 5 last lines above mean, just copied and pasted them from the user's PR 🤷 — piwi -->

## Accessing the request context anywhere

Strapi exposes a way to access the current request context from anywhere in the code (e.g. lifecycle functions).

You can access the request as follows:

```js
const ctx = strapi.requestContext.get();
```

You should only use this inside of functions that will be called in the context of an HTTP request.

```js
// correct

const service = {
  myFunction() {
    const ctx = strapi.requestContext.get();
    console.log(ctx.state.user);
  },
};

// incorrect
const ctx = strapi.requestContext.get();

const service = {
  myFunction() {
    console.log(ctx.state.user);
  },
};
```

**Example:**

```js title="./api/test/content-types/article/lifecycles.js"
module.exports = {
  beforeUpdate() {
    const ctx = strapi.requestContext.get();

    console.log('User info in service: ', ctx.state.user);
  },
};
```

:::note
Strapi uses a Node.js feature called <ExternalLink to="https://nodejs.org/docs/latest-v16.x/api/async_context.html#class-asynclocalstorage" text="AsyncLocalStorage"/> to make the context available anywhere.
:::

---

title: Policies
description: Strapi policies are functions that execute specific logic on each request before it reaches the controller. Policies can be customized according to your needs.
displayed_sidebar: cmsSidebar
tags:

- backend customization
- backend server
- controllers
- global policies
- plugin policies
- middlewares
- policies
- REST API
- routes

---

# Policies

<Tldr>
Policies execute before controllers to enforce authorization or other checks on routes. Instructions in this documentation cover generating global or scoped policies and wiring them into router configs.
</Tldr>

Policies are functions that execute specific logic on each request before it reaches the [controller](/cms/backend-customization/controllers). They are mostly used for securing business logic.

Each [route](/cms/backend-customization/routes) of a Strapi project can be associated to an array of policies. For example, a policy named `is-admin` could check that the request is sent by an admin user, and restrict access to critical routes.

Policies can be global or scoped. [Global policies](#global-policies) can be associated to any route in the project. Scoped policies only apply to a specific [API](#api-policies) or [plugin](#plugin-policies) and should live under the corresponding `./src/api/<api-name>/policies/` or `./src/plugins/<plugin-name>/policies/` folder.

<figure style={{width: '100%', margin: '0'}}>
  <img src="/img/assets/backend-customization/diagram-routes.png" alt="Simplified Strapi backend diagram with routes and policies highlighted" />
  <em><figcaption style={{fontSize: '12px'}}>The diagram represents a simplified version of how a request travels through the Strapi back end, with policies and routes highlighted. The backend customization introduction page includes a complete, <a href="/cms/backend-customization#interactive-diagram">interactive diagram</a>.</figcaption></em>
</figure>

## Implementation

A new policy can be implemented:

- with the [interactive CLI command `strapi generate`](/cms/cli#strapi-generate)
- or manually by creating a JavaScript file in the appropriate folder (see [project structure](/cms/project-structure)):
  - `./src/policies/` for global policies
  - `./src/api/[api-name]/policies/` for API policies
  - `./src/plugins/[plugin-name]/policies/` for plugin policies

<br/>

Global policy implementation example:

<Tabs groupId="js-ts">

<TabItem value="js" label="JavaScript">

```js title="./src/policies/is-authenticated.js"
module.exports = (policyContext, config, { strapi }) => {
  if (policyContext.state.user) {
    // if a session is open
    // go to next policy or reach the controller's action
    return true;
  }

  return false; // If you return nothing, Strapi considers you didn't want to block the request and will let it pass
};
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```ts title="./src/policies/is-authenticated.ts"
export default (policyContext, config, { strapi }) => {
  if (policyContext.state.user) {
    // if a session is open
    // go to next policy or reach the controller's action
    return true;
  }

  return false; // If you return nothing, Strapi considers you didn't want to block the request and will let it pass
};
```

</TabItem>
</Tabs>

`policyContext` is a wrapper around the [controller](/cms/backend-customization/controllers) context. It adds some logic that can be useful to implement a policy for both REST and GraphQL.

<br/>

Policies can be configured using a `config` object:

<Tabs groupId="js-ts">
<TabItem value="js" label="JavaScript">

```js title="./src/api/[api-name]/policies/my-policy.js"
module.exports = (policyContext, config, { strapi }) => {
  if (policyContext.state.user.role.code === config.role) {
    // if user's role is the same as the one described in configuration
    return true;
  }

  return false; // If you return nothing, Strapi considers you didn't want to block the request and will let it pass
};
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```ts title="./src/api/[api-name]/policies/my-policy.ts"
export default (policyContext, config, { strapi }) => {
  if (policyContext.state.user.role.code === config.role) {
    // if user's role is the same as the one described in configuration
    return true;
  }

  return false; // If you return nothing, Strapi considers you didn't want to block the request and will let it pass
};
```

</TabItem>
</Tabs>

## Usage

To apply policies to a route, add them to its configuration object (see [routes documentation](/cms/backend-customization/routes#policies)).

Policies are called different ways depending on their scope:

- use `global::policy-name` for [global policies](#global-policies)
- use `api::api-name.policy-name` for [API policies](#api-policies)
- use `plugin::plugin-name.policy-name` for [plugin policies](#plugin-policies)

:::tip
To list all the available policies, run `yarn strapi policies:list`.
:::

### Global policies

Global policies can be associated to any route in a project.

<Tabs groupId="js-ts">

<TabItem value="js" label="JavaScript">

```js title="./src/api/restaurant/routes/custom-restaurant.js"
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/restaurants',
      handler: 'Restaurant.find',
      config: {
        /**
          Before executing the find action in the Restaurant.js controller,
          we call the global 'is-authenticated' policy,
          found at ./src/policies/is-authenticated.js.
         */
        policies: ['global::is-authenticated'],
      },
    },
  ],
};
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```ts title="./src/api/restaurant/routes/custom-restaurant.ts"
export default {
  routes: [
    {
      method: 'GET',
      path: '/restaurants',
      handler: 'Restaurant.find',
      config: {
        /**
          Before executing the find action in the Restaurant.js controller,
          we call the global 'is-authenticated' policy,
          found at ./src/policies/is-authenticated.js.
         */
        policies: ['global::is-authenticated'],
      },
    },
  ],
};
```

</TabItem>
</Tabs>

### Plugin policies

Plugins can add and expose policies to an application. For example, the [Users & Permissions feature](/cms/features/users-permissions) comes with policies to ensure that the user is authenticated or has the rights to perform an action:

<Tabs groupId="js-ts">

<TabItem value="js" label="JavaScript">

```js title="./src/api/restaurant/routes/custom-restaurant.js"
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/restaurants',
      handler: 'Restaurant.find',
      config: {
        /**
          The `isAuthenticated` policy prodived with the `users-permissions` plugin 
          is executed before the `find` action in the `Restaurant.js` controller.
        */
        policies: ['plugin::users-permissions.isAuthenticated'],
      },
    },
  ],
};
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```ts title="./src/api/restaurant/routes/custom-restaurant.ts"
export default {
  routes: [
    {
      method: 'GET',
      path: '/restaurants',
      handler: 'Restaurant.find',
      config: {
        /**
          The `isAuthenticated` policy prodived with the `users-permissions` plugin 
          is executed before the `find` action in the `Restaurant.js` controller.
        */
        policies: ['plugin::users-permissions.isAuthenticated'],
      },
    },
  ],
};
```

</TabItem>
</Tabs>

### API policies

API policies are associated to the routes defined in the API where they have been declared.

<Tabs groupId="js-ts">

<TabItem value="js" label="JavaScript">

```js title="./src/api/restaurant/policies/is-admin.js."
module.exports = async (policyContext, config, { strapi }) => {
  if (policyContext.state.user.role.name === 'Administrator') {
    // Go to next policy or will reach the controller's action.
    return true;
  }

  return false;
};
```

```js title="./src/api/restaurant/routes/custom-restaurant.js"
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/restaurants',
      handler: 'Restaurant.find',
      config: {
        /**
          The `is-admin` policy found at `./src/api/restaurant/policies/is-admin.js`
          is executed before the `find` action in the `Restaurant.js` controller.
         */
        policies: ['is-admin'],
      },
    },
  ],
};
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```ts title="./src/api/restaurant/policies/is-admin.ts"
export default (policyContext, config, { strapi }) => {
  if (policyContext.state.user.role.name === 'Administrator') {
    // Go to next policy or will reach the controller's action.
    return true;
  }

  return false;
};
```

```ts title="./src/api/restaurant/routes/custom-restaurant.ts"
export default {
  routes: [
    {
      method: 'GET',
      path: '/restaurants',
      handler: 'Restaurant.find',
      config: {
        /**
          The `is-admin` policy found at `./src/api/restaurant/policies/is-admin.js`
          is executed before the `find` action in the `Restaurant.ts` controller.
         */
        policies: ['is-admin'],
      },
    },
  ],
};
```

</TabItem>
</Tabs>

To use a policy in another API, reference it with the following syntax: `api::[apiName].[policyName]`:

<Tabs groupId="js-ts">

<TabItem value="js" label="JavaScript">

```js title="./src/api/category/routes/custom-category.js"
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/categories',
      handler: 'Category.find',
      config: {
        /**
          The `is-admin` policy found at `./src/api/restaurant/policies/is-admin.js`
          is executed before the `find` action in the `Restaurant.js` controller.
        */
        policies: ['api::restaurant.is-admin'],
      },
    },
  ],
};
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```ts title="./src/api/category/routes/custom-category.ts"
export default {
  routes: [
    {
      method: 'GET',
      path: '/categories',
      handler: 'Category.find',
      config: {
        /**
          The `is-admin` policy found at `./src/api/restaurant/policies/is-admin.ts`
          is executed before the `find` action in the `Restaurant.js` controller.
        */
        policies: ['api::restaurant.is-admin'],
      },
    },
  ],
};
```

</TabItem>
</Tabs>

---

title: Middlewares
tags:

- backend customization
- backend server
- controllers
- ctx
- global middlewares
- is-owner policy
- middlewares
- middlewares customization
- REST API
- route middlewares
- routes

---

import MiddlewareTypes from '/docs/snippets/middleware-types.md'

# Middlewares customization

<Tldr>
Middlewares alter the request or response flow at application or API levels. This documentation distinguishes global versus route middlewares and illustrates custom implementations with generation patterns.
</Tldr>

<MiddlewareTypes />

<figure style={{width: '100%', margin: '0'}}>
  <img src="/img/assets/backend-customization/diagram-global-middlewares.png" alt="Simplified Strapi backend diagram with global middlewares highlighted" />
  <em><figcaption style={{fontSize: '12px'}}>The diagram represents a simplified version of how a request travels through the Strapi back end, with global middlewares highlighted. The backend customization introduction page includes a complete, <a href="/cms/backend-customization#interactive-diagram">interactive diagram</a>.</figcaption></em>
</figure>

## Implementation

A new application-level or API-level middleware can be implemented:

- with the [interactive CLI command `strapi generate`](/cms/cli#strapi-generate)
- or manually by creating a JavaScript file in the appropriate folder (see [project structure](/cms/project-structure)):
  - `./src/middlewares/` for application-level middlewares
  - `./src/api/[api-name]/middlewares/` for API-level middlewares
  - `./src/plugins/[plugin-name]/middlewares/` for [plugin middlewares](/cms/plugins-development/server-api#middlewares)

Middlewares working with the REST API are functions like the following:

<Tabs groupId="js-ts">
<TabItem value="js" label="JavaScript">

```js title="./src/middlewares/my-middleware.js or ./src/api/[api-name]/middlewares/my-middleware.js"
module.exports = (config, { strapi }) => {
  return (context, next) => {};
};
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```js title="./src/middlewares/my-middleware.js or ./src/api/[api-name]/middlewares/my-middleware.ts"
export default (config, { strapi }) => {
  return (context, next) => {};
};
```

</TabItem>
</Tabs>

Globally scoped custom middlewares should be added to the [middlewares configuration file](/cms/configurations/middlewares#loading-order) or Strapi won't load them.

API level and plugin middlewares can be added into the specific router that they are relevant to like the following:

```js title="./src/api/[api-name]/routes/[collection-name].js or ./src/plugins/[plugin-name]/server/routes/index.js"
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/[collection-name]',
      handler: '[controller].find',
      config: {
        middlewares: ['[middleware-name]'],
        // See the usage section below for middleware naming conventions
      },
    },
  ],
};
```

<details>
<summary>Example of a custom timer middleware</summary>

<Tabs groupId="js-ts">
<TabItem value="js" label="JavaScript">

```js title="path: /config/middlewares.js"
module.exports = () => {
  return async (ctx, next) => {
    const start = Date.now();

    await next();

    const delta = Math.ceil(Date.now() - start);
    ctx.set('X-Response-Time', delta + 'ms');
  };
};
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```ts title="/config/middlewares.ts"
export default () => {
  return async (ctx, next) => {
    const start = Date.now();

    await next();

    const delta = Math.ceil(Date.now() - start);
    ctx.set('X-Response-Time', delta + 'ms');
  };
};
```

</TabItem>
</Tabs>

</details>

The GraphQL plugin also allows [implementing custom middlewares](/cms/plugins/graphql#middlewares), with a different syntax.

:::tip Discover loaded middlewares
Run `yarn strapi middlewares:list` to list all registered middlewares and double‑check naming when wiring them in routers.
:::

## Usage

Middlewares are called different ways depending on their scope:

- use `global::middleware-name` for application-level middlewares
- use `api::api-name.middleware-name` for API-level middlewares
- use `plugin::plugin-name.middleware-name` for plugin middlewares

:::tip
To list all the registered middlewares, run `yarn strapi middlewares:list`.
:::

### Restricting content access with an "is-owner policy"

It is often required that the author of an entry is the only user allowed to edit or delete the entry. In previous versions of Strapi, this was known as an "is-owner policy". With Strapi v4, the recommended way to achieve this behavior is to use a middleware.

Proper implementation largely depends on your project's needs and custom code, but the most basic implementation could be achieved with the following procedure:

1. From your project's folder, create a middleware with the Strapi CLI generator, by running the `yarn strapi generate` (or `npm run strapi generate`) command in the terminal.
2. Select `middleware` from the list, using keyboard arrows, and press Enter.
3. Give the middleware a name, for instance `isOwner`.
4. Choose `Add middleware to an existing API` from the list.
5. Select which API you want the middleware to apply.
6. Replace the code in the `/src/api/[your-api-name]/middlewares/isOwner.js` file with the following, replacing `api::restaurant.restaurant` in line 22 with the identifier corresponding to the API you choose at step 5 (e.g., `api::blog-post.blog-post` if your API name is `blog-post`):

```js showLineNumbers title="src/api/blog-post/middlewares/isOwner.js"
'use strict';

/**
 * `isOwner` middleware
 */

module.exports = (config, { strapi }) => {
  // Add your own logic here.
  return async (ctx, next) => {
    const user = ctx.state.user;
    const entryId = ctx.params.id ? ctx.params.id : undefined;
    let entry = {};

    /**
     * Gets all information about a given entry,
     * populating every relations to ensure
     * the response includes author-related information
     */
    if (entryId) {
      entry = await strapi.documents('api::restaurant.restaurant').findOne(entryId, { populate: '*' });
    }

    /**
     * Compares user id and entry author id
     * to decide whether the request can be fulfilled
     * by going forward in the Strapi backend server
     */
    if (user.id !== entry.author.id) {
      return ctx.unauthorized('This action is unauthorized.');
    } else {
      return next();
    }
  };
};
```

7. Ensure the middleware is configured to apply on some routes. In the `config` object found in the `src/api/[your-api–name]/routes/[your-content-type-name].js` file, define the action keys (`find`, `findOne`, `create`, `update`, `delete`, etc.) for which you would like the middleware to apply, and declare the `isOwner` middleware for these routes.<br /><br />For instance, if you wish to allow GET requests (mapping to the `find` and `findOne` actions) and POST requests (i.e., the `create` action) to any user for the `restaurant` content-type in the `restaurant` API, but would like to restrict PUT (i.e., `update` action) and DELETE requests only to the user who created the entry, you could use the following code in the `src/api/restaurant/routes/restaurant.js` file:

```js title="src/api/restaurant/routes/restaurant.js"
/**
 * restaurant router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::restaurant.restaurant', {
  config: {
    update: {
      middlewares: ['api::restaurant.is-owner'],
    },
    delete: {
      middlewares: ['api::restaurant.is-owner'],
    },
  },
});
```

:::info
You can find more information about route middlewares in the [routes documentation](/cms/backend-customization/routes).
:::

---

title: Controllers
tags:

- backend customization
- backend server
- controllers
- createCoreController
- core controllers
- ctx
- REST API
- routes
- sanitizeQuery function
- strapi-utils
- validateQuery function

---

# Controllers

<Tldr>
Controllers bundle actions that handle business logic for each route within Strapi’s MVC pattern. This documentation demonstrates generating controllers, extending core ones with `createCoreController`, and delegating heavy logic to services.
</Tldr>

Controllers are JavaScript files that contain a set of methods, called actions, reached by the client according to the requested [route](/cms/backend-customization/routes). Whenever a client requests the route, the action performs the business logic code and sends back the [response](/cms/backend-customization/requests-responses). Controllers represent the C in the model-view-controller (MVC) pattern.

In most cases, the controllers will contain the bulk of a project's business logic. But as a controller's logic becomes more and more complicated, it's a good practice to use [services](/cms/backend-customization/services) to organize the code into re-usable parts.

<figure style={{width: '100%', margin: '0'}}>
  <img src="/img/assets/backend-customization/diagram-controllers-services.png" alt="Simplified Strapi backend diagram with controllers highlighted" />
  <em><figcaption style={{fontSize: '12px'}}>The diagram represents a simplified version of how a request travels through the Strapi back end, with controllers highlighted. The backend customization introduction page includes a complete, <a href="/cms/backend-customization#interactive-diagram">interactive diagram</a>.</figcaption></em>
</figure>

:::caution Sanitize inputs and outputs
When overriding core actions, always validate and sanitize queries and responses to avoid leaking private fields or bypassing access rules. Use `validateQuery` (optional), `sanitizeQuery` (recommended), and `sanitizeOutput` before returning data from custom actions. See the example below for a safe `find` override.
:::

## Implementation

Controllers can be [generated or added manually](#adding-a-new-controller). Strapi provides a `createCoreController` factory function that automatically generates core controllers and allows building custom ones or [extend or replace the generated controllers](#extending-core-controllers).

### Adding a new controller

A new controller can be implemented:

- with the [interactive CLI command `strapi generate`](/cms/cli)
- or manually by creating a JavaScript file:
  - in `./src/api/[api-name]/controllers/` for API controllers (this location matters as controllers are auto-loaded by Strapi from there)
  - or in a folder like `./src/plugins/[plugin-name]/server/controllers/` for plugin controllers, though they can be created elsewhere as long as the plugin interface is properly exported in the `strapi-server.js` file (see [Server API for Plugins documentation](/cms/plugins-development/server-api))

<Tabs groupId="js-ts">
<TabItem value="js" label="JavaScript">

```js title="./src/api/restaurant/controllers/restaurant.js"
const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::restaurant.restaurant', ({ strapi }) => ({
  // Method 1: Creating an entirely custom action
  async exampleAction(ctx) {
    try {
      ctx.body = 'ok';
    } catch (err) {
      ctx.body = err;
    }
  },

  // Method 2: Wrapping a core action (leaves core logic in place)
  async find(ctx) {
    // some custom logic here
    ctx.query = { ...ctx.query, local: 'en' };

    // Calling the default core action
    const { data, meta } = await super.find(ctx);

    // some more custom logic
    meta.date = Date.now();

    return { data, meta };
  },

  // Method 3: Replacing a core action with proper sanitization
  async find(ctx) {
    // validateQuery (optional)
    // to throw an error on query params that are invalid or the user does not have access to
    await this.validateQuery(ctx);

    // sanitizeQuery to remove any query params that are invalid or the user does not have access to
    // It is strongly recommended to use sanitizeQuery even if validateQuery is used
    const sanitizedQueryParams = await this.sanitizeQuery(ctx);
    const { results, pagination } = await strapi.service('api::restaurant.restaurant').find(sanitizedQueryParams);
    const sanitizedResults = await this.sanitizeOutput(results, ctx);

    return this.transformResponse(sanitizedResults, { pagination });
  },
}));
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```ts title="./src/api/restaurant/controllers/restaurant.ts"
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::restaurant.restaurant', ({ strapi }) => ({
  // Method 1: Creating an entirely custom action
  async exampleAction(ctx) {
    try {
      ctx.body = 'ok';
    } catch (err) {
      ctx.body = err;
    }
  },

  // Method 2: Wrapping a core action (leaves core logic in place)
  async find(ctx) {
    // some custom logic here
    ctx.query = { ...ctx.query, local: 'en' };

    // Calling the default core action
    const { data, meta } = await super.find(ctx);

    // some more custom logic
    meta.date = Date.now();

    return { data, meta };
  },

  // Method 3: Replacing a core action with proper sanitization
  async find(ctx) {
    // validateQuery (optional)
    // to throw an error on query params that are invalid or the user does not have access to
    await this.validateQuery(ctx);

    // sanitizeQuery to remove any query params that are invalid or the user does not have access to
    // It is strongly recommended to use sanitizeQuery even if validateQuery is used
    const sanitizedQueryParams = await this.sanitizeQuery(ctx);
    const { results, pagination } = await strapi.service('api::restaurant.restaurant').find(sanitizedQueryParams);

    // sanitizeOutput to ensure the user does not receive any data they do not have access to
    const sanitizedResults = await this.sanitizeOutput(results, ctx);

    return this.transformResponse(sanitizedResults, { pagination });
  },
}));
```

</TabItem>
</Tabs>

Each controller action can be an `async` or `sync` function.
Every action receives a context object (`ctx`) as a parameter. `ctx` contains the [request context](/cms/backend-customization/requests-responses#ctxrequest) and the [response context](/cms/backend-customization/requests-responses#ctxresponse).

<details>
<summary>Example: GET /hello route calling a basic controller</summary>

A specific `GET /hello` [route](/cms/backend-customization/routes) is defined, the name of the router file (i.e. `index`) is used to call the controller handler (i.e. `index`). Every time a `GET /hello` request is sent to the server, Strapi calls the `index` action in the `hello.js` controller, which returns `Hello World!`:

<Tabs groupId="js-ts">

<TabItem value="js" label="JavaScript">

```js "title="./src/api/hello/routes/hello.js"
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/hello',
      handler: 'api::hello.hello.index',
    },
  ],
};
```

```js title="./src/api/hello/controllers/hello.js"
module.exports = {
  async index(ctx, next) {
    // called by GET /hello
    ctx.body = 'Hello World!'; // we could also send a JSON
  },
};
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```js title="./src/api/hello/routes/hello.ts"
export default {
  routes: [
    {
      method: 'GET',
      path: '/hello',
      handler: 'api::hello.hello.index',
    },
  ],
};
```

```js title="./src/api/hello/controllers/hello.ts"
export default {
  async index(ctx, next) {
    // called by GET /hello
    ctx.body = 'Hello World!'; // we could also send a JSON
  },
};
```

</TabItem>

</Tabs>

</details>

:::note
When a new [content-type](/cms/backend-customization/models#content-types) is created, Strapi builds a generic controller with placeholder code, ready to be customized.
:::

:::tip
To see a possible advanced usage for custom controllers, read the [services and controllers](/cms/backend-customization/examples/services-and-controllers) page of the backend customization examples cookbook.
:::

### Controllers & Routes: How routes reach controller actions

- Core mapping is automatic: when you generate a content-type, Strapi creates the matching controller and a router file that already targets the standard actions (`find`, `findOne`, `create`, `update`, and `delete`). Overriding any of these actions inside the generated controller does not require touching the router — the route keeps the same handler string and executes your updated logic.
- Adding a route should only be done for new actions or paths. If you introduce a brand-new method such as `exampleAction`, create or update a route entry whose `handler` points to the action so HTTP requests can reach it. Use the fully-qualified handler syntax `<scope>::<api-or-plugin-name>.<controllerName>.<actionName>` (e.g. `api::restaurant.restaurant.exampleAction` for an API controller or `plugin::menus.menu.exampleAction` for a plugin controller).
- Regarding controller and route filenames: the default controller name comes from the filename inside `./src/api/[api-name]/controllers/`. Core routers created with `createCoreRouter` adopt the same name, so the generated handler string matches automatically. Custom routers can follow any file naming scheme, as long as the `handler` string references an exported controller action.

The example below adds a new controller action and exposes it through a custom route without duplicating the existing CRUD route definitions:

```js title="./src/api/restaurant/controllers/restaurant.js"
const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::restaurant.restaurant', ({ strapi }) => ({
  async exampleAction(ctx) {
    const specials = await strapi.service('api::restaurant.restaurant').find({ filters: { isSpecial: true } });
    return this.transformResponse(specials.results);
  },
}));
```

```js title="./src/api/restaurant/routes/01-custom-restaurant.js"
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/restaurants/specials',
      handler: 'api::restaurant.restaurant.exampleAction',
    },
  ],
};
```

### Sanitization and Validation in controllers {#sanitization-and-validation-in-controllers}

:::warning
It's strongly recommended you sanitize (v4.8.0+) and/or validate (v4.13.0+) your incoming request query utilizing the new `sanitizeQuery` and `validateQuery` functions to prevent the leaking of private data.
:::

Sanitization means that the object is “cleaned” and returned.

Validation means an assertion is made that the data is already clean and throws an error if something is found that shouldn't be there.

In Strapi 5, both query parameters and input data (i.e., create and update body data) are validated. Any create and update data requests with the following invalid input will throw a `400 Bad Request` error:

- relations the user do not have permission to create
- unrecognized values that are not present on a schema
- non-writable fields and internal timestamps like `createdAt` and `createdBy` fields
- setting or updating an `id` field (except for connecting relations)

#### Sanitization when utilizing controller factories

Within the Strapi factories the following functions are exposed that can be used for sanitization and validation:

| Function Name    | Parameters                 | Description                                                                          |
| ---------------- | -------------------------- | ------------------------------------------------------------------------------------ |
| `sanitizeQuery`  | `ctx`                      | Sanitizes the request query                                                          |
| `sanitizeOutput` | `entity`/`entities`, `ctx` | Sanitizes the output data where entity/entities should be an object or array of data |
| `sanitizeInput`  | `data`, `ctx`              | Sanitizes the input data                                                             |
| `validateQuery`  | `ctx`                      | Validates the request query (throws an error on invalid params)                      |
| `validateInput`  | `data`, `ctx`              | (EXPERIMENTAL) Validates the input data (throws an error on invalid data)            |

These functions automatically inherit the sanitization settings from the model and sanitize the data accordingly based on the content-type schema and any of the content API authentication strategies, such as the Users & Permissions plugin or API tokens.

:::warning
Because these methods use the model associated with the current controller, if you query data that is from another model (i.e., doing a find for "menus" within a "restaurant" controller method), you must instead use the `strapi.contentAPI` methods, such as `strapi.contentAPI.sanitize.query` described in [Sanitizing Custom Controllers](#sanitize-validate-custom-controllers), or else the result of your query will be sanitized against the wrong model.
:::

<Tabs groupId="js-ts">
<TabItem value="js" label="JavaScript">

```js title="./src/api/restaurant/controllers/restaurant.js"
const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::restaurant.restaurant', ({ strapi }) => ({
  async find(ctx) {
    await this.validateQuery(ctx);
    const sanitizedQueryParams = await this.sanitizeQuery(ctx);
    const { results, pagination } = await strapi.service('api::restaurant.restaurant').find(sanitizedQueryParams);
    const sanitizedResults = await this.sanitizeOutput(results, ctx);

    return this.transformResponse(sanitizedResults, { pagination });
  },
}));
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```js title="./src/api/restaurant/controllers/restaurant.ts"
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::restaurant.restaurant', ({ strapi }) => ({
  async find(ctx) {
    const sanitizedQueryParams = await this.sanitizeQuery(ctx);
    const { results, pagination } = await strapi.service('api::restaurant.restaurant').find(sanitizedQueryParams);
    const sanitizedResults = await this.sanitizeOutput(results, ctx);

    return this.transformResponse(sanitizedResults, { pagination });
  },
}));
```

</TabItem>
</Tabs>

#### Sanitization and validation when building custom controllers {#sanitize-validate-custom-controllers}

Within custom controllers, Strapi exposes the following functions via `strapi.contentAPI` for sanitization and validation:

| Function Name                       | Parameters                    | Description                                                                                                                                           |
| ----------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `strapi.contentAPI.sanitize.input`  | `data`, `schema`, `auth`      | Sanitizes the request input including non-writable fields, removing restricted relations, and other nested "visitors" added by plugins                |
| `strapi.contentAPI.sanitize.output` | `data`, `schema`, `auth`      | Sanitizes the response output including restricted relations, private fields, passwords, and other nested "visitors" added by plugins                 |
| `strapi.contentAPI.sanitize.query`  | `ctx.query`, `schema`, `auth` | Sanitizes the request query including filters, sort, fields, and populate                                                                             |
| `strapi.contentAPI.validate.query`  | `ctx.query`, `schema`, `auth` | Validates the request query including filters, sort, fields (currently not populate)                                                                  |
| `strapi.contentAPI.validate.input`  | `data`, `schema`, `auth`      | (EXPERIMENTAL) Validates the request input including non-writable fields, removing restricted relations, and other nested "visitors" added by plugins |

:::note
Depending on the complexity of your custom controllers, you may need additional sanitization that Strapi cannot currently account for, especially when combining the data from multiple sources.
:::

<Tabs groupId="js-ts">
<TabItem value="js" label="JavaScript">

```js title="./src/api/restaurant/controllers/restaurant.js"
module.exports = {
  async findCustom(ctx) {
    const contentType = strapi.contentType('api::test.test');

    await strapi.contentAPI.validate.query(ctx.query, contentType, { auth: ctx.state.auth });
    const sanitizedQueryParams = await strapi.contentAPI.sanitize.query(ctx.query, contentType, {
      auth: ctx.state.auth,
    });

    const documents = await strapi.documents(contentType.uid).findMany(sanitizedQueryParams);

    return await strapi.contentAPI.sanitize.output(documents, contentType, { auth: ctx.state.auth });
  },
};
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```js title="./src/api/restaurant/controllers/restaurant.ts"
export default {
  async findCustom(ctx) {
    const contentType = strapi.contentType('api::test.test');

    await strapi.contentAPI.validate.query(ctx.query, contentType, { auth: ctx.state.auth });
    const sanitizedQueryParams = await strapi.contentAPI.sanitize.query(ctx.query, contentType, {
      auth: ctx.state.auth,
    });

    const documents = await strapi.documents(contentType.uid).findMany(sanitizedQueryParams);

    return await strapi.contentAPI.sanitize.output(documents, contentType, { auth: ctx.state.auth });
  },
};
```

</TabItem>
</Tabs>

### Extending core controllers {#extending-core-controllers}

Default controllers and actions are created for each content-type. These default controllers are used to return responses to API requests (e.g. when `GET /api/articles/3` is accessed, the `findOne` action of the default controller for the "Article" content-type is called). Default controllers can be customized to implement your own logic. The following code examples should help you get started.

:::tip
An action from a core controller can be replaced entirely by [creating a custom action](#adding-a-new-controller) and naming the action the same as the original action (e.g. `find`, `findOne`, `create`, `update`, or `delete`).
:::

:::tip
When extending a core controller, you do not need to re-implement any sanitization as it will already be handled by the core controller you are extending. Where possible it's strongly recommended to extend the core controller instead of creating a custom controller.
:::

<details>
<summary>Collection type examples</summary>

:::tip
The [backend customization examples cookbook](/cms/backend-customization/examples) shows how you can overwrite a default controller action, for instance for the [`create` action](/cms/backend-customization/examples/services-and-controllers#custom-controller).
:::
<Tabs>
<TabItem value="find" label="`find()`">

```js
async find(ctx) {
  // some logic here
  const { data, meta } = await super.find(ctx);
  // some more logic

  return { data, meta };
}
```

</TabItem>
<TabItem value="findOne" label="findOne()">

```js
async findOne(ctx) {
  // some logic here
  const response = await super.findOne(ctx);
  // some more logic

  return response;
}
```

</TabItem>

<TabItem value="create" label="create()">

```js
async create(ctx) {
  // some logic here
  const response = await super.create(ctx);
  // some more logic

  return response;
}
```

</TabItem>

<TabItem value="update" label="update()">

```js
async update(ctx) {
  // some logic here
  const response = await super.update(ctx);
  // some more logic

  return response;
}
```

</TabItem>

<TabItem value="delete" label="delete()">

```js
async delete(ctx) {
  // some logic here
  const response = await super.delete(ctx);
  // some more logic

  return response;
}
```

</TabItem>
</Tabs>
</details>

<details>
<summary>Single type examples</summary>
<Tabs>

<TabItem value="find" label="find()">

```js
async find(ctx) {
  // some logic here
  const response = await super.find(ctx);
  // some more logic

  return response;
}
```

</TabItem>

<TabItem value="update" label="update()">

```js
async update(ctx) {
  // some logic here
  const response = await super.update(ctx);
  // some more logic

  return response;
}
```

</TabItem>

<TabItem value="delete" label="delete()">

```js
async delete(ctx) {
  // some logic here
  const response = await super.delete(ctx);
  // some more logic

  return response;
}
```

</TabItem>
</Tabs>
</details>

## Usage

Controllers are declared and attached to a route. Controllers are automatically called when the route is called, so controllers usually do not need to be called explicitly. However, [services](/cms/backend-customization/services) can call controllers, and in this case the following syntax should be used:

```js
// access an API controller
strapi.controller('api::api-name.controller-name');
// access a plugin controller
strapi.controller('plugin::plugin-name.controller-name');
```

:::tip  
To list all the available controllers, run `yarn strapi controllers:list`.
:::

---

title: Services
description: Strapi services are a set of reusable functions, useful to simplify controllers logic.
displayed_sidebar: cmsSidebar
tags:

- backend customization
- backend server
- controllers
- createCoreService
- services
- REST API

---

# Services

<Tldr>
Services store reusable functions to keep controllers concise and follow DRY principles. This documentation explains generating or extending services with `createCoreService` and organizing them for APIs or plugins.
</Tldr>

Services are a set of reusable functions. They are particularly useful to respect the "don’t repeat yourself" (DRY) programming concept and to simplify [controllers](/cms/backend-customization/controllers.md) logic.

<figure style={{width: '100%', margin: '0'}}>
  <img src="/img/assets/backend-customization/diagram-controllers-services.png" alt="Simplified Strapi backend diagram with services highlighted" />
  <em><figcaption style={{fontSize: '12px'}}>The diagram represents a simplified version of how a request travels through the Strapi back end, with services highlighted. The backend customization introduction page includes a complete, <a href="/cms/backend-customization#interactive-diagram">interactive diagram</a>.</figcaption></em>
</figure>

## Implementation

Services can be [generated or added manually](#adding-a-new-service). Strapi provides a `createCoreService` factory function that automatically generates core services and allows building custom ones or [extend or replace the generated services](#extending-core-services).

### Adding a new service

A new service can be implemented:

- with the [interactive CLI command `strapi generate`](/cms/cli#strapi-generate)
- or manually by creating a JavaScript file in the appropriate folder (see [project structure](/cms/project-structure.md)):
  - `./src/api/[api-name]/services/` for API services
  - or `./src/plugins/[plugin-name]/services/` for [plugin services](/cms/plugins-development/server-api#services).

To manually create a service, export a factory function that returns the service implementation (i.e. an object with methods). This factory function receives the `strapi` instance:

<Tabs groupId="js-ts">

<TabItem value="js" label="JavaScript">

```js title="./src/api/restaurant/services/restaurant.js"
const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::restaurant.restaurant', ({ strapi }) => ({
  // Method 1: Creating an entirely new custom service
  async exampleService(...args) {
    let response = { okay: true };

    if (response.okay === false) {
      return { response, error: true };
    }

    return response;
  },

  // Method 2: Wrapping a core service (leaves core logic in place)
  async find(...args) {
    // Calling the default core controller
    const { results, pagination } = await super.find(...args);

    // some custom logic
    results.forEach((result) => {
      result.counter = 1;
    });

    return { results, pagination };
  },

  // Method 3: Replacing a core service
  async findOne(documentId, params = {}) {
    return strapi.documents('api::restaurant.restaurant').findOne(documentId, this.getFetchParams(params));
  },
}));
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```ts title="./src/api/restaurant/services/restaurant.ts"
import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::restaurant.restaurant', ({ strapi }) => ({
  // Method 1: Creating an entirely custom service
  async exampleService(...args) {
    let response = { okay: true };

    if (response.okay === false) {
      return { response, error: true };
    }

    return response;
  },

  // Method 2: Wrapping a core service (leaves core logic in place)
  async find(...args) {
    // Calling the default core controller
    const { results, pagination } = await super.find(...args);

    // some custom logic
    results.forEach((result) => {
      result.counter = 1;
    });

    return { results, pagination };
  },

  // Method 3: Replacing a core service
  async findOne(documentId, params = {}) {
    return strapi.documents('api::restaurant.restaurant').findOne(documentId, this.getFetchParams(params));
  },
}));
```

</TabItem>
</Tabs>

:::strapi Document Service API
To get started creating your own services, see Strapi's built-in functions in the [Document Service API](/cms/api/document-service) documentation.
:::

<details>

<summary>Example of a custom email service (using Nodemailer)</summary>

The goal of a service is to store reusable functions. A `sendNewsletter` service could be useful to send emails from different functions in our codebase that have a specific purpose:

<Tabs groupId="js-ts">

<TabItem value="js" label="JavaScript">

```js title="./src/api/restaurant/services/restaurant.js"
const { createCoreService } = require('@strapi/strapi').factories;
const nodemailer = require('nodemailer'); // Requires nodemailer to be installed (npm install nodemailer)

// Create reusable transporter object using SMTP transport.
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'user@gmail.com',
    pass: 'password',
  },
});

module.exports = createCoreService('api::restaurant.restaurant', ({ strapi }) => ({
  sendNewsletter(from, to, subject, text) {
    // Setup e-mail data.
    const options = {
      from,
      to,
      subject,
      text,
    };

    // Return a promise of the function that sends the email.
    return transporter.sendMail(options);
  },
}));
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```ts title="./src/api/restaurant/services/restaurant.ts"
import { factories } from '@strapi/strapi';
const nodemailer = require('nodemailer'); // Requires nodemailer to be installed (npm install nodemailer)

// Create reusable transporter object using SMTP transport.
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'user@gmail.com',
    pass: 'password',
  },
});

export default factories.createCoreService('api::restaurant.restaurant', ({ strapi }) => ({
  sendNewsletter(from, to, subject, text) {
    // Setup e-mail data.
    const options = {
      from,
      to,
      subject,
      text,
    };

    // Return a promise of the function that sends the email.
    return transporter.sendMail(options);
  },
}));
```

</TabItem>

</Tabs>

The service is now available through the `strapi.service('api::restaurant.restaurant').sendNewsletter(...args)` global variable. It can be used in another part of the codebase, like in the following controller:

<Tabs groupId="js-ts">

<TabItem value="js" label="JavaScript">

```js title="./src/api/restaurant/controllers/restaurant.js"
module.exports = createCoreController('api::restaurant.restaurant', ({ strapi }) => ({
  // GET /hello
  async signup(ctx) {
    const { userData } = ctx.body;

    // Store the new user in database.
    const user = await strapi.service('plugin::users-permissions.user').add(userData);

    // Send an email to validate his subscriptions.
    strapi.service('api::restaurant.restaurant').sendNewsletter('welcome@mysite.com', user.email, 'Welcome', '...');

    // Send response to the server.
    ctx.send({
      ok: true,
    });
  },
}));
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```js title="./src/api/restaurant/controllers/restaurant.ts"
export default factories.createCoreController('api::restaurant.restaurant', ({ strapi }) => ({
  // GET /hello
  async signup(ctx) {
    const { userData } = ctx.body;

    // Store the new user in database.
    const user = await strapi.service('plugin::users-permissions.user').add(userData);

    // Send an email to validate his subscriptions.
    strapi.service('api::restaurant.restaurant').sendNewsletter('welcome@mysite.com', user.email, 'Welcome', '...');

    // Send response to the server.
    ctx.send({
      ok: true,
    });
  },
}));
```

</TabItem>

</Tabs>

</details>

:::note
When a new [content-type](/cms/backend-customization/models.md#content-types) is created, Strapi builds a generic service with placeholder code, ready to be customized.
:::

### Extending core services

Core services are created for each content-type and could be used by [controllers](/cms/backend-customization/controllers.md) to execute reusable logic through a Strapi project. Core services can be customized to implement your own logic. The following code examples should help you get started.

:::tip
A core service can be replaced entirely by [creating a custom service](#adding-a-new-service) and naming it the same as the core service (e.g. `find`, `findOne`, `create`, `update`, or `delete`).
:::

<details>
<summary>Collection type examples</summary>

<Tabs groupdId="crud-methods">

<TabItem value="find" label="find()">

```js
async find(params) {
  // some logic here
  const { results, pagination } = await super.find(params);
  // some more logic

  return { results, pagination };
}
```

</TabItem>

<TabItem value="find-one" label="findOne()">

```js
async findOne(documentId, params) {
  // some logic here
  const result = await super.findOne(documentId, params);
  // some more logic

  return result;
}
```

</TabItem>

<TabItem value="create" label="create()">

```js
async create(params) {
  // some logic here
  const result = await super.create(params);
  // some more logic

  return result;
}
```

</TabItem>

<TabItem value="update" label="update()">

```js
async update(documentId, params) {
  // some logic here
  const result = await super.update(documentId, params);
  // some more logic

  return result;
}
```

</TabItem>

<TabItem value="delete" label="delete()">

```js
async delete(documentId, params) {
  // some logic here
  const result = await super.delete(documentId, params);
  // some more logic

  return result;
}
```

</TabItem>
</Tabs>

</details>

<details>

<summary>Single type examples</summary>

<Tabs groupdId="crud-methods">

<TabItem value="find" label="find()">

```js
async find(params) {
  // some logic here
  const document = await super.find(params);
  // some more logic

  return document;
}
```

</TabItem>

<TabItem value="update" label="update()">

```js
async createOrUpdate({ data, ...params }) {
  // some logic here
  const document = await super.createOrUpdate({ data, ...params });
  // some more logic

  return document;
}
```

</TabItem>

<TabItem value="delete" label="delete()">

```js
async delete(params) {
  // some logic here
  const document = await super.delete(params);
  // some more logic

  return document;
}
```

</TabItem>
</Tabs>

</details>

## Usage

Once a service is created, it's accessible from [controllers](/cms/backend-customization/controllers.md) or from other services:

```js
// access an API service
strapi.service('api::apiName.serviceName').FunctionName();
// access a plugin service
strapi.service('plugin::pluginName.serviceName').FunctionName();
```

In the syntax examples above, `serviceName` is the name of the service file for API services or the name used to export the service file to `services/index.js` for plugin services.

:::tip
To list all the available services, run `yarn strapi services:list`.
:::

### Core service methods

Services generated with `createCoreService` inherit methods that wrap the [Document Service API](/cms/api/document-service). The available methods depend on the content-type:

#### Collection types

| Method                             | Description                                                                                                |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `find(params)`                     | Wrapper for [`findMany`](/cms/api/document-service#findmany); returns a paginated list of documents.       |
| `findOne(documentId, params)`      | Wrapper for [`findOne`](/cms/api/document-service#findone); returns a single document by its `documentId`. |
| `create(params)`                   | Wrapper for [`create`](/cms/api/document-service#create); creates a new document.                          |
| `update(documentId, params)`       | Wrapper for [`update`](/cms/api/document-service#update); updates an existing document.                    |
| `delete(documentId, params)`       | Wrapper for [`delete`](/cms/api/document-service#delete); removes a document.                              |
| `count(params)`                    | Wrapper for [`count`](/cms/api/document-service#count); returns the number of matching documents.          |
| `publish(documentId, params)`      | Wrapper for [`publish`](/cms/api/document-service#publish); publishes a draft document.                    |
| `unpublish(documentId, params)`    | Wrapper for [`unpublish`](/cms/api/document-service#unpublish); unpublishes a document.                    |
| `discardDraft(documentId, params)` | Wrapper for [`discardDraft`](/cms/api/document-service#discarddraft); deletes the draft copy.              |

#### Single types

| Method                                | Description                                                                                                 |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `find(params)`                        | Returns the single document (uses [`findFirst`](/cms/api/document-service#findfirst) internally).           |
| `createOrUpdate({ data, ...params })` | Creates the document if it doesn't exist or updates it (uses [`update`](/cms/api/document-service#update)). |
| `delete(params)`                      | Deletes the document (uses [`delete`](/cms/api/document-service#delete)).                                   |
| `count(params)`                       | Counts documents matching the filters (uses [`count`](/cms/api/document-service#count)).                    |
| `publish(params)`                     | Publishes a draft document (uses [`publish`](/cms/api/document-service#publish)).                           |
| `unpublish(params)`                   | Unpublishes the document (uses [`unpublish`](/cms/api/document-service#unpublish)).                         |
| `discardDraft(params)`                | Deletes the draft copy (uses [`discardDraft`](/cms/api/document-service#discarddraft)).                     |

#### Parameters and default behavior

Core service methods accept the same parameters as their underlying [Document Service API](/cms/api/document-service) calls, such as `fields`, `filters`, `sort`, `pagination`, `populate`, `locale`, and `status`. When no `status` is provided, Strapi automatically sets `status: 'published'` so only published content is returned. To query draft documents, explicitly pass `status: 'draft'` or another value supported by the Document Service.

The `createCoreService` factory also exposes a `getFetchParams(params)` helper that converts a controller's query object into the parameter format expected by these methods. This helper can be reused when overriding core methods to forward sanitized parameters to `strapi.documents()`.

---

title: Models
description: Strapi models (i.e. content-types, components, and dynamic zones) define a representation of the content structure.
toc_max_heading_level: 4
tags:

- admin panel
- backend customization
- backend server
- content-type
- Content-type Builder
- models
- model schema
- lifecycle hooks
- REST API

---

# Models

<Tldr>
Models define Strapi’s content structure via content-types and reusable components. This documentation walks through creating these models in the Content-type Builder or CLI and managing schema files with optional lifecycle hooks.
</Tldr>

As Strapi is a headless Content Management System (CMS), creating a content structure for the content is one of the most important aspects of using the software. Models define a representation of the content structure.

There are 2 different types of models in Strapi:

- content-types, which can be collection types or single types, depending on how many entries they manage,
- and components that are content structures re-usable in multiple content-types.

If you are just starting out, it is convenient to generate some models with the [Content-type Builder](/cms/features/content-type-builder) directly in the admin panel. The user interface takes over a lot of validation tasks and showcases all the options available to create the content's content structure. The generated model mappings can then be reviewed at the code level using this documentation.

## Model creation

Content-types and components models are created and stored differently.

### Content-types

Content-types in Strapi can be created:

- with the [Content-type Builder in the admin panel](/cms/features/content-type-builder),
- or with [Strapi's interactive CLI `strapi generate`](/cms/cli#strapi-generate) command.

The content-types use the following files:

- `schema.json` for the model's [schema](#model-schema) definition. (generated automatically, when creating content-type with either method)
- `lifecycles.js` for [lifecycle hooks](#lifecycle-hooks). This file must be created manually.

These models files are stored in `./src/api/[api-name]/content-types/[content-type-name]/`, and any JavaScript or JSON file found in these folders will be loaded as a content-type's model (see [project structure](/cms/project-structure)).

:::note
In [TypeScript](/cms/typescript.md)-enabled projects, schema typings can be generated using the `ts:generate-types` command.
:::

### Components {#components-creation}

Component models can't be created with CLI tools. Use the [Content-type Builder](/cms/features/content-type-builder) or create them manually.

Components models are stored in the `./src/components` folder. Every component has to be inside a subfolder, named after the category the component belongs to (see [project structure](/cms/project-structure)).

## Model schema

The `schema.json` file of a model consists of:

- [settings](#model-settings), such as the kind of content-type the model represents or the table name in which the data should be stored,
- [information](#model-information), mostly used to display the model in the admin panel and access it through the REST and GraphQL APIs,
- [attributes](#model-attributes), which describe the content structure of the model,
- and [options](#model-options) used to defined specific behaviors on the model.

### Model settings

General settings for the model can be configured with the following parameters:

| Parameter                                                | Type   | Description                                                                                                                   |
| -------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `collectionName`                                         | String | Database table name in which the data should be stored                                                                        |
| `kind`<br /><br />_Optional,<br/>only for content-types_ | String | Defines if the content-type is:<ul><li>a collection type (`collectionType`)</li><li>or a single type (`singleType`)</li></ul> |

```json
// ./src/api/[api-name]/content-types/restaurant/schema.json

{
  "kind": "collectionType",
  "collectionName": "Restaurants_v1"
}
```

### Model information

The `info` key in the model's schema describes information used to display the model in the admin panel and access it through the Content API. It includes the following parameters:

<!-- ? with the new design system, do we still use FontAwesome?  -->

| Parameter      | Type   | Description                                                                                                                                    |
| -------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `displayName`  | String | Default name to use in the admin panel                                                                                                         |
| `singularName` | String | Singular form of the content-type name.<br />Used to generate the API routes and databases/tables collection.<br /><br />Should be kebab-case. |
| `pluralName`   | String | Plural form of the content-type name.<br />Used to generate the API routes and databases/tables collection.<br /><br />Should be kebab-case.   |
| `description`  | String | Description of the model                                                                                                                       |

```json title="./src/api/[api-name]/content-types/restaurant/schema.json"

  "info": {
    "displayName": "Restaurant",
    "singularName": "restaurant",
    "pluralName": "restaurants",
    "description": ""
  },
```

### Model attributes

The content structure of a model consists of a list of attributes. Each attribute has a `type` parameter, which describes its nature and defines the attribute as a simple piece of data or a more complex structure used by Strapi.

Many types of attributes are available:

- scalar types (e.g. strings, dates, numbers, booleans, etc.),
- Strapi-specific types, such as:
  - `media` for files uploaded through the [Media library](/cms/features/content-type-builder#media)
  - `relation` to describe a [relation](#relations) between content-types
  - `customField` to describe [custom fields](#custom-fields) and their specific keys
  - `component` to define a [component](#components-json) (i.e. a content structure usable in multiple content-types)
  - `dynamiczone` to define a [dynamic zone](#dynamic-zones) (i.e. a flexible space based on a list of components)
  - and the `locale` and `localizations` types, only used by the [Internationalization (i18n) plugin](/cms/features/internationalization)

The `type` parameter of an attribute should be one of the following values:

| Type categories                                                                                                                                          | Available types                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| String types                                                                                                                                             | <ul><li>`string`</li> <li>`text`</li> <li>`richtext`</li><li>`enumeration`</li> <li>`email`</li><li>`password`</li><li>[`uid`](#uid-type)</li></ul>                                |
| Date types                                                                                                                                               | <ul><li>`date`</li> <li>`time`</li> <li>`datetime`</li> <li>`timestamp`</li></ul>                                                                                                  |
| Number types                                                                                                                                             | <ul><li>`integer`</li><li>`biginteger`</li><li>`float`</li> <li>`decimal`</li></ul>                                                                                                |
| Other generic types                                                                                                                                      | <ul><li>`boolean`</li><li>`json`</li></ul>                                                                                                                                         |
| Special types unique to Strapi                                                                                                                           | <ul><li>`media`</li><li>[`relation`](#relations)</li><li>[`customField`](#custom-fields)</li><li>[`component`](#components-json)</li><li>[`dynamiczone`](#dynamic-zones)</li></ul> |
| Internationalization (i18n)-related types<br /><br />_Can only be used if the [i18n](/cms/features/internationalization) is enabled on the content-type_ | <ul><li>`locale`</li><li>`localizations`</li></ul>                                                                                                                                 |

#### Validations

Basic validations can be applied to attributes using the following parameters:

| Parameter      | Type    | Description                                                                                                           | Default |
| -------------- | ------- | --------------------------------------------------------------------------------------------------------------------- | ------- |
| `required`     | Boolean | If `true`, adds a required validator for this property                                                                | `false` |
| `max`          | Integer | Checks if the value is greater than or equal to the given maximum                                                     | -       |
| `min`          | Integer | Checks if the value is less than or equal to the given minimum                                                        | -       |
| `minLength`    | Integer | Minimum number of characters for a field input value                                                                  | -       |
| `maxLength`    | Integer | Maximum number of characters for a field input value                                                                  | -       |
| `private`      | Boolean | If `true`, the attribute will be removed from the server response.<br/><br/>💡 This is useful to hide sensitive data. | `false` |
| `configurable` | Boolean | If `false`, the attribute isn't configurable from the Content-type Builder plugin.                                    | `true`  |

```json title="./src/api/[api-name]/content-types/restaurant/schema.json"
{
  // ...
  "attributes": {
    "title": {
      "type": "string",
      "minLength": 3,
      "maxLength": 99,
      "unique": true
    },
    "description": {
      "default": "My description",
      "type": "text",
      "required": true
    },
    "slug": {
      "type": "uid",
      "targetField": "title"
    }
    // ...
  }
}
```

#### Database validations and settings

:::caution 🚧 This API is considered experimental.
These settings should be reserved to an advanced usage, as they might break some features. There are no plans to make these settings stable.
:::

Database validations and settings are custom options passed directly onto the `tableBuilder` Knex.js function during schema migrations. Database validations allow for an advanced degree of control for setting custom column settings. The following options are set in a `column: {}` object per attribute:

| Parameter     | Type    | Description                                                                                                                                                   | Default |
| ------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `name`        | string  | Changes the name of the column in the database                                                                                                                | -       |
| `defaultTo`   | string  | Sets the database `defaultTo`, typically used with `notNullable`                                                                                              | -       |
| `notNullable` | boolean | Sets the database `notNullable`, ensures that columns cannot be null                                                                                          | `false` |
| `unsigned`    | boolean | Only applies to number columns, removes the ability to go negative but doubles maximum length                                                                 | `false` |
| `unique`      | boolean | Enforces database-level uniqueness on published entries. Draft saves skip the check when Draft & Publish is enabled, so duplicates fail only at publish time. | `false` |
| `type`        | string  | Changes the database type, if `type` has arguments, you should pass them in `args`                                                                            | -       |
| `args`        | array   | Arguments passed into the Knex.js function that changes things like `type`                                                                                    | `[]`    |

:::caution Draft & Publish and `unique`
When [Draft & Publish](/cms/features/draft-and-publish) is enabled, Strapi intentionally skips `unique` validations while an entry is saved as a draft. Duplicates therefore remain undetected until publication, at which point the database constraint triggers an error even though the UI previously displayed “Saved document” for the drafts.

To avoid unexpected publication failures:

- disable Draft & Publish on content-types that must stay globally unique,
- or add custom validation (e.g. lifecycle hooks or middleware) that checks for draft duplicates before saving,
- or rely on automatically generated unique identifiers such as a `uid` field and document editorial conventions.
  :::

```json title="./src/api/[api-name]/content-types/restaurant/schema.json"
{
  // ...
  "attributes": {
    "title": {
      "type": "string",
      "minLength": 3,
      "maxLength": 99,
      "unique": true,
      "column": {
        "unique": true // enforce database unique also
      }
    },
    "description": {
      "default": "My description",
      "type": "text",
      "required": true,
      "column": {
        "defaultTo": "My description", // set database level default
        "notNullable": true // enforce required at database level, even for drafts
      }
    },
    "rating": {
      "type": "decimal",
      "default": 0,
      "column": {
        "defaultTo": 0,
        "type": "decimal", // using the native decimal type but allowing for custom precision
        "args": [
          6,
          1 // using custom precision and scale
        ]
      }
    }
    // ...
  }
}
```

#### `uid` type

The `uid` type is used to automatically prefill the field value in the admin panel with a unique identifier (UID) (e.g. slugs for articles) based on 2 optional parameters:

- `targetField` (string): If used, the value of the field defined as a target is used to auto-generate the UID.
- `options` (string): If used, the UID is generated based on a set of options passed to <ExternalLink to="https://github.com/sindresorhus/slugify" text="the underlying `uid` generator"/>. The resulting `uid` must match the following regular expression pattern: `/^[A-Za-z0-9-_.~]*$`.

#### Relations

Relations link content-types together. Strapi supports both single-entry relations (one-way and one-to-one) and multi relations where at least one side can point to several entries (one-to-many, many-to-one, many-to-many, and many-way). Multi relations are persisted as arrays in the database layer and are returned as arrays in the Content API responses.

Relations are explicitly defined in the [attributes](#model-attributes) of a model with `type: 'relation'` and accept the following additional parameters:

| Parameter                                         | Description                                                                                                                       |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `relation`                                        | The type of relation among these values:<ul><li>`oneToOne`</li><li>`oneToMany`</li><li>`manyToOne`</li><li>`manyToMany`</li></ul> |
| `target`                                          | Accepts a string value as the name of the target content-type                                                                     |
| `mappedBy` and `inversedBy`<br /><br />_Optional_ | In bidirectional relations, the owning side declares the `inversedBy` key while the inversed side declares the `mappedBy` key     |

<Tabs>

<TabItem value="one-to-one" label="One-to-one">

One-to-One relationships are useful when one entry can be linked to only one other entry.

They can be unidirectional or bidirectional. In unidirectional relationships, only one of the models can be queried with its linked item.

<details>
<summary>Unidirectional use case example:</summary>

- A blog article belongs to a category.
- Querying an article can retrieve its category,
- but querying a category won't retrieve the owned article.

```json title="./src/api/[api-name]/content-types/article/schema.json"

  // …
  attributes: {
    category: {
      type: 'relation',
      relation: 'oneToOne',
      target: 'category',
    },
  },
  // …
```

</details>

<details>
<summary>Bidirectional use case example:</summary>

- A blog article belongs to a category.
- Querying an article can retrieve its category,
- and querying a category also retrieves its owned article.

```json title="./src/api/[api-name]/content-types/article/schema.json"

  // …
  attributes: {
    category: {
      type: 'relation',
      relation: 'oneToOne',
      target: 'category',
      inversedBy: 'article',
    },
  },
  // …

```

```json title="./src/api/[api-name]/content-types/category/schema.json"

  // …
  attributes: {
    article: {
      type: 'relation',
      relation: 'oneToOne',
      target: 'article',
      mappedBy: 'category',
    },
  },
  // …

```

</details>

</TabItem>

<TabItem value="one-to-many" label="One-to-Many">

One-to-Many relationships are useful when:

- an entry from a content-type A is linked to many entries of another content-type B,
- while an entry from content-type B is linked to only one entry of content-type A.

One-to-many relationships are always bidirectional, and are usually defined with the corresponding Many-to-One relationship:

<details>
<summary>Example:</summary>
A person can own many plants, but a plant is owned by only one person.

```json title="./src/api/[api-name]/content-types/plant/schema.json"

  // …
  attributes: {
    owner: {
      type: 'relation',
      relation: 'manyToOne',
      target: 'api::person.person',
      inversedBy: 'plants',
    },
  },
  // …

```

```json title="./src/api/person/models/schema.json"

  // …
  attributes: {
    plants: {
      type: 'relation',
      relation: 'oneToMany',
      target: 'api::plant.plant',
      mappedBy: 'owner',
    },
  },
  // …
```

</details>

</TabItem>

<TabItem value="many-to-one" label="Many-to-One">

Many-to-One relationships are useful to link many entries to one entry.

They can be unidirectional or bidirectional. In unidirectional relationships, only one of the models can be queried with its linked item.

<details>
<summary>Unidirectional use case example:</summary>

A book can be written by many authors.

```json title="./src/api/[api-name]/content-types/book/schema.json"

  // …
  attributes: {
    author: {
      type: 'relation',
      relation: 'manyToOne',
      target: 'author',
    },
  },
  // …

```

</details>

<details>
<summary>Bidirectional use case example:</summary>

An article belongs to only one category but a category has many articles.

```json title="./src/api/[api-name]/content-types/article/schema.json"

  // …
  attributes: {
    author: {
      type: 'relation',
      relation: 'manyToOne',
      target: 'category',
      inversedBy: 'article',
    },
  },
  // …
```

```json title="./src/api/[api-name]/content-types/category/schema.json"

  // …
  attributes: {
    books: {
      type: 'relation',
      relation: 'oneToMany',
      target: 'article',
      mappedBy: 'category',
    },
  },
  // …
```

</details>

</TabItem>

<TabItem value="many-to-many" label="Many-to-Many">

Many-to-Many relationships are useful when:

- an entry from content-type A is linked to many entries of content-type B,
- and an entry from content-type B is also linked to many entries from content-type A.

Many-to-many relationships can be unidirectional or bidirectional. In unidirectional relationships, only one of the models can be queried with its linked item.

<details>
<summary>Unidirectional use case example:</summary>

```json
  // …
  attributes: {
    categories: {
      type: 'relation',
      relation: 'manyToMany',
      target: 'category',
    },
  },
  // …
```

</details>

<details>
<summary>Bidirectional use case example:</summary>

An article can have many tags and a tag can be assigned to many articles.

```json title="/src/api/[api-name]/content-types/article/schema.json"

  // …
  attributes: {
    tags: {
      type: 'relation',
      relation: 'manyToMany',
      target: 'tag',
      inversedBy: 'articles',
    },
  },
  // …
```

```json title="./src/api/[api-name]/content-types/tag/schema.json"

  // …
  attributes: {
    articles: {
      type: 'relation',
      relation: 'manyToMany',
      target: 'article',
      mappedBy: 'tag',
    },
  },
  // …
```

</details>

<!-- ? not sure what to do with this note and the following example, that's why I commented them for now -->
<!-- :::tip NOTE
The `tableName` key defines the name of the join table. It has to be specified once. If it is not specified, Strapi will use a generated default one. It is useful to define the name of the join table when the name generated by Strapi is too long for the database you use.
:::

**Path —** `./src/api/category/models/Category.settings.json`.

```js
{
  "attributes": {
    "products": {
      "collection": "product",
      "via": "categories"
    }
  }
}
``` -->

</TabItem>

</Tabs>

#### Custom fields

[Custom fields](/cms/features/custom-fields) extend Strapi’s capabilities by adding new types of fields to content-types. Custom fields are explicitly defined in the [attributes](#model-attributes) of a model with `type: customField`.

Custom fields' attributes also show the following specificities:

- a `customField` attribute whose value acts as a unique identifier to indicate which registered custom field should be used. Its value follows:
  - either the `plugin::plugin-name.field-name` format if a plugin created the custom field
  - or the `global::field-name` format for a custom field specific to the current Strapi application
- and additional parameters depending on what has been defined when registering the custom field (see [custom fields documentation](/cms/features/custom-fields)).

```json title="./src/api/[apiName]/[content-type-name]/content-types/schema.json"
{
  // …
  "attributes": {
    "attributeName": {
      // attributeName would be replaced by the actual attribute name
      "type": "customField",
      "customField": "plugin::color-picker.color",
      "options": {
        "format": "hex"
      }
    }
  }
  // …
}
```

#### Components {#components-json}

Component fields create a relation between a content-type and a component structure. Components are explicitly defined in the [attributes](#model-attributes) of a model with `type: 'component'` and accept the following additional parameters:

| Parameter    | Type    | Description                                                                                 |
| ------------ | ------- | ------------------------------------------------------------------------------------------- |
| `repeatable` | Boolean | Could be `true` or `false` depending on whether the component is repeatable or not          |
| `component`  | String  | Define the corresponding component, following this format:<br/>`<category>.<componentName>` |

```json title="./src/api/[apiName]/restaurant/content-types/schema.json"
{
  "attributes": {
    "openinghours": {
      "type": "component",
      "repeatable": true,
      "component": "restaurant.openinghours"
    }
  }
}
```

#### Dynamic zones

Dynamic zones create a flexible space in which to compose content, based on a mixed list of [components](#components-json).

Dynamic zones are explicitly defined in the [attributes](#model-attributes) of a model with `type: 'dynamiczone'`. They also accept a `components` array, where each component should be named following this format: `<category>.<componentName>`.

```json title="./src/api/[api-name]/content-types/article/schema.json"
{
  "attributes": {
    "body": {
      "type": "dynamiczone",
      "components": ["article.slider", "article.content"]
    }
  }
}
```

### Model options

The `options` key is used to define specific behaviors and accepts the following parameter:

| Parameter               | Type             | Description                                                                                                                                                                                                                                                                                                                   |
| ----------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `privateAttributes`     | Array of strings | Allows treating a set of attributes as private, even if they're not actually defined as attributes in the model. It could be used to remove them from API responses timestamps. <br /><br /> The `privateAttributes` defined in the model are merged with the `privateAttributes` defined in the global Strapi configuration. |
| `draftAndPublish`       | Boolean          | Enables the draft and publish feature. <br /><br /> Default value: `true` (`false` if the content-type is created from the interactive CLI).                                                                                                                                                                                  |
| `populateCreatorFields` | Boolean          | Populates `createdBy` and `updatedBy` fields in responses returned by the REST API (see [guide](/cms/api/rest/guides/populate-creator-fields) for more details).<br/><br/>Default value: `false`.                                                                                                                             |

```json title="./src/api/[api-name]/content-types/restaurant/schema.json"
{
  "options": {
    "privateAttributes": ["id", "createdAt"],
    "draftAndPublish": true
  }
}
```

### Plugin options

`pluginOptions` is an optional object allowing plugins to store configuration for a model or a specific attribute.

| Key                    | Value             | Description                                         |
| ---------------------- | ----------------- | --------------------------------------------------- |
| `i18n`                 | `localized: true` | Enables localization.                               |
| `content-manager`      | `visible: false`  | Hides from Content Manager in the admin panel.      |
| `content-type-builder` | `visible: false`  | Hides from Content-type Builder in the admin panel. |

```json title="./src/api/[api-name]/content-types/[content-type-name]/schema.json"
{
  "attributes": {
    "name": {
      "pluginOptions": {
        "i18n": {
          "localized": true
        }
      },
      "type": "string",
      "required": true
    },
    "slug": {
      "pluginOptions": {
        "i18n": {
          "localized": true
        }
      },
      "type": "uid",
      "targetField": "name",
      "required": true
    }
    // …additional attributes
  }
}
```

## Lifecycle hooks

Lifecycle hooks are functions that get triggered when Strapi queries are called. They are triggered automatically when managing content through the administration panel or when developing custom code using `queries`·

Lifecycle hooks can be customized declaratively or programmatically.

:::caution
Lifecycles hooks are not triggered when using directly the <ExternalLink to="https://knexjs.org/" text="knex"/> library instead of Strapi functions.
:::

:::strapi Document Service API: lifecycles and middlewares
The Document Service API triggers various database lifecycle hooks based on which method is called. For a complete reference, see [Document Service API: Lifecycle hooks](/cms/migration/v4-to-v5/breaking-changes/lifecycle-hooks-document-service#table). Bulk actions lifecycles (`createMany`, `updateMany`, `deleteMany`) will never be triggered by a Document Service API method. [Document Service middlewares](/cms/api/document-service/middlewares) can be implemented too.
:::

### Available lifecycle events

The following lifecycle events are available:

- `beforeCreate`
- `beforeCreateMany`
- `afterCreate`
- `afterCreateMany`
- `beforeUpdate`
- `beforeUpdateMany`
- `afterUpdate`
- `afterUpdateMany`
- `beforeDelete`
- `beforeDeleteMany`
- `afterDelete`
- `afterDeleteMany`
- `beforeCount`
- `afterCount`
- `beforeFindOne`
- `afterFindOne`
- `beforeFindMany`
- `afterFindMany`

### Hook `event` object

Lifecycle hooks are functions that take an `event` parameter, an object with the following keys:

| Key      | Type                   | Description                                                                                                                                                      |
| -------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action` | String                 | Lifecycle event that has been triggered (see [list](#available-lifecycle-events))                                                                                |
| `model`  | Array of strings (uid) | An array of uids of the content-types whose events will be listened to.<br />If this argument is not supplied, events are listened on all content-types.         |
| `params` | Object                 | Accepts the following parameters:<ul><li>`data`</li><li>`select`</li><li>`where`</li><li>`orderBy`</li><li>`limit`</li><li>`offset`</li><li>`populate`</li></ul> |
| `result` | Object                 | _Optional, only available with `afterXXX` events_<br /><br />Contains the result of the action.                                                                  |
| `state`  | Object                 | Query state, can be used to share state between `beforeXXX` and `afterXXX` events of a query.                                                                    |

<!-- TODO: `state` has not been implemented yet, ask for more info once done -->

### Declarative and programmatic usage

To configure a content-type lifecycle hook, create a `lifecycles.js` file in the `./src/api/[api-name]/content-types/[content-type-name]/` folder.

Each event listener is called sequentially. They can be synchronous or asynchronous.

<Tabs groupdId="js-ts">

<TabItem value="js" label="JavaScript">

```js title="./src/api/[api-name]/content-types/[content-type-name]/lifecycles.js"
module.exports = {
  beforeCreate(event) {
    const { data, where, select, populate } = event.params;

    // let's do a 20% discount everytime
    event.params.data.price = event.params.data.price * 0.8;
  },

  afterCreate(event) {
    const { result, params } = event;

    // do something to the result;
  },
};
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```js title="./src/api/[api-name]/content-types/[content-type-name]/lifecycles.ts"
export default {
  beforeCreate(event) {
    const { data, where, select, populate } = event.params;

    // let's do a 20% discount everytime
    event.params.data.price = event.params.data.price * 0.8;
  },

  afterCreate(event) {
    const { result, params } = event;

    // do something to the result;
  },
};
```

</TabItem>
</Tabs>

Using the database layer API, it's also possible to register a subscriber and listen to events programmatically:

```js title="./src/index.js"
module.exports = {
  async bootstrap({ strapi }) {
    // registering a subscriber
    strapi.db.lifecycles.subscribe({
      models: [], // optional;

      beforeCreate(event) {
        const { data, where, select, populate } = event.params;

        event.state = 'doStuffAfterWards';
      },

      afterCreate(event) {
        if (event.state === 'doStuffAfterWards') {
        }

        const { result, params } = event;

        // do something to the result
      },
    });

    // generic subscribe for generic handling
    strapi.db.lifecycles.subscribe((event) => {
      if (event.action === 'beforeCreate') {
        // do something
      }
    });
  },
};
```

---

title: Webhooks
displayed_sidebar: cmsSidebar
description: Strapi webhooks are user-defined HTTP callbacks used by an application to notify other applications that an event occurred.
tags:

- backend customization
- backend server
- defaultHeaders
- Headers
- lifecycle hooks
- payload
- REST API
- webhooks

---

# Webhooks

<Tldr>
Webhooks let Strapi notify external systems when content changes, while omitting the Users type for privacy. Configuration in `config/server` sets default headers and endpoints to trigger third-party processing.
</Tldr>

Webhook is a construct used by an application to notify other applications that an event occurred. More precisely, webhook is a user-defined HTTP callback. Using a webhook is a good way to tell third-party providers to start some processing (CI, build, deployment ...).

The way a webhook works is by delivering information to a receiving application through HTTP requests (typically POST requests).

## User content-type webhooks

To prevent from unintentionally sending any user's information to other applications, Webhooks will not work for the User content-type.
If you need to notify other applications about changes in the Users collection, you can do so by creating [Lifecycle hooks](/cms/backend-customization/models#lifecycle-hooks) using the `./src/index.js` example.

## Available configurations

You can set webhook configurations inside the file `./config/server`.

- `webhooks`
  - `defaultHeaders`: You can set default headers to use for your webhook requests. This option is overwritten by the headers set in the webhook itself.

**Example configuration**

<Tabs groupId="js-ts">

<TabItem value="js" label="JavaScript">

```js title="./config/server.js"
module.exports = {
  webhooks: {
    defaultHeaders: {
      'Custom-Header': 'my-custom-header',
    },
  },
};
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```js title="./config/server.ts"
export default {
  webhooks: {
    defaultHeaders: {
      'Custom-Header': 'my-custom-header',
    },
  },
};
```

</TabItem>
</Tabs>

## Webhooks security

Most of the time, webhooks make requests to public URLs, therefore it is possible that someone may find that URL and send it wrong information.

To prevent this from happening you can send a header with an authentication token. Using the Admin panel you would have to do it for every webhook.

Another way is to define `defaultHeaders` to add to every webhook request.

You can configure these global headers by updating the file at `./config/server`:

<Tabs>

<TabItem value="simple-token" label="Simple token">

<Tabs groupId="js-ts">
<TabItem value="js" label="JavaScript">

```js title="./config/server.js"
module.exports = {
  webhooks: {
    defaultHeaders: {
      Authorization: 'Bearer my-very-secured-token',
    },
  },
};
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```js title="./config/server.ts"
export default {
  webhooks: {
    defaultHeaders: {
      Authorization: 'Bearer my-very-secured-token',
    },
  },
};
```

</TabItem>
</Tabs>

</TabItem>

<TabItem value="environment-variable" label="Environment variable">

<Tabs groupId="js-ts">
<TabItem value="js" label="JavaScript">

```js title="./config/server.js"
module.exports = {
  webhooks: {
    defaultHeaders: {
      Authorization: `Bearer ${process.env.WEBHOOK_TOKEN}`,
    },
  },
};
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```js title="./config/server.ts"
export default {
  webhooks: {
    defaultHeaders: {
      Authorization: `Bearer ${process.env.WEBHOOK_TOKEN}`,
    },
  },
};
```

</TabItem>
</Tabs>

</TabItem>

</Tabs>

If you are developing the webhook handler yourself you can now verify the token by reading the headers.

### Verifying signatures

In addition to auth headers, it's recommended to sign webhook payloads and verify signatures server‑side to prevent tampering and replay attacks. To do so, you can use the following guidelines:

- Generate a shared secret and store it in environment variables
- Have the sender compute an HMAC (e.g., SHA‑256) over the raw request body plus a timestamp
- Send the signature (and timestamp) in headers (e.g., `X‑Webhook‑Signature`, `X‑Webhook‑Timestamp`)
- On receipt, recompute the HMAC and compare using a constant‑time check
- Reject if the signature is invalid or the timestamp is too old to mitigate replay

<details>
<summary>Example: Verify HMAC signatures (Node.js)</summary>

Here is a minimal Node.js middleware example (pseudo‑code) showing <ExternalLink text="HMAC" to="https://nodejs.org/api/crypto.html#class-hmac" /> verification:

<Tabs groupId="js-ts">
<TabItem value="js" label="JavaScript">

```js title="/src/middlewares/verify-webhook.js"
const crypto = require("crypto");

module.exports = (config, { strapi }) => {
  const secret = process.env.WEBHOOK_SECRET;

  return async (ctx, next) => {
    const signature = ctx.get("X-Webhook-Signature");
    const timestamp = ctx.get("X-Webhook-Timestamp");
    if (!signature || !timestamp) return ctx.unauthorized("Missing signature");

    // Compute HMAC over raw body + timestamp
    const raw = ctx.request.rawBody || (ctx.request.body and JSON.stringify(ctx.request.body)) || "";
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(timestamp + "." + raw);
    const expected = "sha256=" + hmac.digest("hex");

    // Constant-time compare + basic replay protection
    const ok = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    const skew = Math.abs(Date.now() - Number(timestamp));
    if (!ok or skew > 5 * 60 * 1000) {
      return ctx.unauthorized("Invalid or expired signature");
    }

    await next();
  };
};
```

</TabItem>

<TabItem value="ts" label="TypeScript">

```ts title="/src/middlewares/verify-webhook.ts"
import crypto from 'node:crypto';

export default (config: unknown, { strapi }: any) => {
  const secret = process.env.WEBHOOK_SECRET as string;

  return async (ctx: any, next: any) => {
    const signature = ctx.get('X-Webhook-Signature') as string;
    const timestamp = ctx.get('X-Webhook-Timestamp') as string;
    if (!signature || !timestamp) return ctx.unauthorized('Missing signature');

    // Compute HMAC over raw body + timestamp
    const raw: string = ctx.request.rawBody || (ctx.request.body && JSON.stringify(ctx.request.body)) || '';
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${timestamp}.${raw}`);
    const expected = `sha256=${hmac.digest('hex')}`;

    // Constant-time compare + basic replay protection
    const ok = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    const skew = Math.abs(Date.now() - Number(timestamp));
    if (!ok || skew > 5 * 60 * 1000) {
      return ctx.unauthorized('Invalid or expired signature');
    }

    await next();
  };
};
```

</TabItem>
</Tabs>

Here are a few additional external examples:

- <ExternalLink to="https://docs.github.com/webhooks/using-webhooks/validating-webhook-deliveries" text="GitHub — Validating webhook deliveries" />
- <ExternalLink to="https://stripe.com/docs/webhooks/signatures" text="Stripe — Verify webhook signatures" />
  <br />
  </details>

<!--- ### Usage

To access the webhook configuration panel, go to `Settings` > `Webhooks`.

![Webhooks home](/img/assets/concepts/webhooks/home.png)

#### Create a webhook

Click on `Add new webhook` and fill in the form.

![create](/img/assets/concepts/webhooks/create.png)

#### Trigger a webhook

You can test out a webhook with a test event: `trigger-test`. Open the webhook you want to trigger.

![Trigger ](/img/assets/concepts/webhooks/trigger_start.png)

Click on the `Trigger` button.

![Trigger pending](/img/assets/concepts/webhooks/trigger.png)

You will see the trigger request appear and get the result.

![Trigger result](/img/assets/concepts/webhooks/trigger_result.png)

#### Enable or disable a webhook

You can enable or disable a webhook from the list view directly.

![Disable webhook](/img/assets/concepts/webhooks/disable.png)

#### Update a webhook

You can edit any webhook by clicking on the `pen` icon in the webhook list view.

![Update webhook](/img/assets/concepts/webhooks/list.png)

#### Delete a webhook

You can delete a webhook by clicking on the `trash` icon.

![Delete webhook](/img/assets/concepts/webhooks/disable.png) --->

## Available events

By default Strapi webhooks can be triggered by the following events:

| Name                                                                     | Description                                                                                                                                                                                                     |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`entry.create`](#entrycreate)                                           | Triggered when a Content Type entry is created.                                                                                                                                                                 |
| [`entry.update`](#entryupdate)                                           | Triggered when a Content Type entry is updated.                                                                                                                                                                 |
| [`entry.delete`](#entrydelete)                                           | Triggered when a Content Type entry is deleted.                                                                                                                                                                 |
| [`entry.publish`](#entrypublish)                                         | Triggered when a Content Type entry is published.\*                                                                                                                                                             |
| [`entry.unpublish`](#entryunpublish)                                     | Triggered when a Content Type entry is unpublished.\*                                                                                                                                                           |
| [`media.create`](#mediacreate)                                           | Triggered when a media is created.                                                                                                                                                                              |
| [`media.update`](#mediaupdate)                                           | Triggered when a media is updated.                                                                                                                                                                              |
| [`media.delete`](#mediadelete)                                           | Triggered when a media is deleted.                                                                                                                                                                              |
| [`review-workflows.updateEntryStage`](#review-workflowsupdateentrystage) | Triggered when content is moved between review stages (see [review workflows](/cms/features/review-workflows#configuration)).<br />This event is only available with the <EnterpriseBadge /> edition of Strapi. |
| [`releases.publish`](#releases-publish)                                  | Triggered when a Release is published (see [Releases](/cms/features/releases)).<br />This event is only available with the <GrowthBadge /> or <EnterpriseBadge /> plan of Strapi CMS.                           |

\*only when `draftAndPublish` is enabled on this Content Type.

## Payloads

:::info
Private fields are not sent in the payload.
:::

### Headers

When a payload is delivered to your webhook's URL, it will contain specific headers:

| Header           | Description                                |
| ---------------- | ------------------------------------------ |
| `X-Strapi-Event` | Name of the event type that was triggered. |

### `entry.create`

This event is triggered when a new entry is created.

**Example payload**

```json
{
  "event": "entry.create",
  "createdAt": "2020-01-10T08:47:36.649Z",
  "model": "address",
  "entry": {
    "id": 1,
    "geolocation": {},
    "city": "Paris",
    "postal_code": null,
    "category": null,
    "full_name": "Paris",
    "createdAt": "2020-01-10T08:47:36.264Z",
    "updatedAt": "2020-01-10T08:47:36.264Z",
    "cover": null,
    "images": []
  }
}
```

### `entry.update`

This event is triggered when an entry is updated.

**Example payload**

```json
{
  "event": "entry.update",
  "createdAt": "2020-01-10T08:58:26.563Z",
  "model": "address",
  "entry": {
    "id": 1,
    "geolocation": {},
    "city": "Paris",
    "postal_code": null,
    "category": null,
    "full_name": "Paris",
    "createdAt": "2020-01-10T08:47:36.264Z",
    "updatedAt": "2020-01-10T08:58:26.210Z",
    "cover": null,
    "images": []
  }
}
```

### `entry.delete`

This event is triggered when an entry is deleted.

**Example payload**

```json
{
  "event": "entry.delete",
  "createdAt": "2020-01-10T08:59:35.796Z",
  "model": "address",
  "entry": {
    "id": 1,
    "geolocation": {},
    "city": "Paris",
    "postal_code": null,
    "category": null,
    "full_name": "Paris",
    "createdAt": "2020-01-10T08:47:36.264Z",
    "updatedAt": "2020-01-10T08:58:26.210Z",
    "cover": null,
    "images": []
  }
}
```

### `entry.publish`

This event is triggered when an entry is published.

**Example payload**

```json
{
  "event": "entry.publish",
  "createdAt": "2020-01-10T08:59:35.796Z",
  "model": "address",
  "entry": {
    "id": 1,
    "geolocation": {},
    "city": "Paris",
    "postal_code": null,
    "category": null,
    "full_name": "Paris",
    "createdAt": "2020-01-10T08:47:36.264Z",
    "updatedAt": "2020-01-10T08:58:26.210Z",
    "publishedAt": "2020-08-29T14:20:12.134Z",
    "cover": null,
    "images": []
  }
}
```

### `entry.unpublish`

This event is triggered when an entry is unpublished.

**Example payload**

```json
{
  "event": "entry.unpublish",
  "createdAt": "2020-01-10T08:59:35.796Z",
  "model": "address",
  "entry": {
    "id": 1,
    "geolocation": {},
    "city": "Paris",
    "postal_code": null,
    "category": null,
    "full_name": "Paris",
    "createdAt": "2020-01-10T08:47:36.264Z",
    "updatedAt": "2020-01-10T08:58:26.210Z",
    "publishedAt": null,
    "cover": null,
    "images": []
  }
}
```

### `media.create`

This event is triggered when you upload a file on entry creation or through the media interface.

**Example payload**

```json
{
  "event": "media.create",
  "createdAt": "2020-01-10T10:58:41.115Z",
  "media": {
    "id": 1,
    "name": "image.png",
    "hash": "353fc98a19e44da9acf61d71b11895f9",
    "sha256": "huGUaFJhmcZRHLcxeQNKblh53vtSUXYaB16WSOe0Bdc",
    "ext": ".png",
    "mime": "image/png",
    "size": 228.19,
    "url": "/uploads/353fc98a19e44da9acf61d71b11895f9.png",
    "provider": "local",
    "provider_metadata": null,
    "createdAt": "2020-01-10T10:58:41.095Z",
    "updatedAt": "2020-01-10T10:58:41.095Z",
    "related": []
  }
}
```

### `media.update`

This event is triggered when you replace a media or update the metadata of a media through the media interface.

**Example payload**

```json
{
  "event": "media.update",
  "createdAt": "2020-01-10T10:58:41.115Z",
  "media": {
    "id": 1,
    "name": "image.png",
    "hash": "353fc98a19e44da9acf61d71b11895f9",
    "sha256": "huGUaFJhmcZRHLcxeQNKblh53vtSUXYaB16WSOe0Bdc",
    "ext": ".png",
    "mime": "image/png",
    "size": 228.19,
    "url": "/uploads/353fc98a19e44da9acf61d71b11895f9.png",
    "provider": "local",
    "provider_metadata": null,
    "createdAt": "2020-01-10T10:58:41.095Z",
    "updatedAt": "2020-01-10T10:58:41.095Z",
    "related": []
  }
}
```

### `media.delete`

This event is triggered only when you delete a media through the media interface.

**Example payload**

```json
{
  "event": "media.delete",
  "createdAt": "2020-01-10T11:02:46.232Z",
  "media": {
    "id": 11,
    "name": "photo.png",
    "hash": "43761478513a4c47a5fd4a03178cfccb",
    "sha256": "HrpDOKLFoSocilA6B0_icA9XXTSPR9heekt2SsHTZZE",
    "ext": ".png",
    "mime": "image/png",
    "size": 4947.76,
    "url": "/uploads/43761478513a4c47a5fd4a03178cfccb.png",
    "provider": "local",
    "provider_metadata": null,
    "createdAt": "2020-01-07T19:34:32.168Z",
    "updatedAt": "2020-01-07T19:34:32.168Z",
    "related": []
  }
}
```

### `review-workflows.updateEntryStage`

<EnterpriseBadge/>

This event is only available with the <EnterpriseBadge/> plan of Strapi.<br />The event is triggered when content is moved to a new review stage (see [Review Workflows](/cms/features/review-workflows#configuration)).

**Example payload**

```json
{
  "event": "review-workflows.updateEntryStage",
  "createdAt": "2023-06-26T15:46:35.664Z",
  "model": "model",
  "uid": "uid",
  "entity": {
    "id": 2
  },
  "workflow": {
    "id": 1,
    "stages": {
      "from": {
        "id": 1,
        "name": "Stage 1"
      },
      "to": {
        "id": 2,
        "name": "Stage 2"
      }
    }
  }
}
```

### `releases.publish` {#releases-publish}

<GrowthBadge/><EnterpriseBadge/>

The event is triggered when a [release](/cms/features/releases) is published.

**Example payload**

```json
{
  "event": "releases.publish",
  "createdAt": "2024-02-21T16:45:36.877Z",
  "isPublished": true,
  "release": {
    "id": 2,
    "name": "Fall Winter highlights",
    "releasedAt": "2024-02-21T16:45:36.873Z",
    "scheduledAt": null,
    "timezone": null,
    "createdAt": "2024-02-21T15:16:22.555Z",
    "updatedAt": "2024-02-21T16:45:36.875Z",
    "actions": {
      "count": 1
    }
  }
}
```

## Best practices for webhook handling

- Validate incoming requests by checking headers and payload signatures.
- Implement retries for failed webhook requests to handle transient errors.
- Log webhook events for debugging and monitoring.
- Use secure, HTTPS endpoints for receiving webhooks.
- Set up rate limiting to avoid being overwhelmed by multiple webhook requests.

:::tip
If you want to learn more about how to use webhooks with Next.js, please have a look at the [dedicated blog article](https://strapi.io/blog/how-to-create-an-ssg-static-site-generation-application-with-strapi-webhooks-and-nextjs).
:::
