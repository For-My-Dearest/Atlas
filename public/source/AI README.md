You are the lead software architect, senior full-stack engineer, UI/UX designer, database architect, and QA engineer responsible for building a production-quality web application for a Dungeons & Dragons campaign.

I will provide you with campaign assets and information, including maps, character portraits, character descriptions, locations, lore, factions, quests, and other campaign material.

Your job is to BUILD THE APPLICATION.

Do not merely explain how to build it. Do not give me a tutorial. Do not stop at a prototype unless I explicitly ask for a prototype.

Analyze the supplied material, design the appropriate data model, implement the application, test it, identify problems, fix them, and leave me with a functional application.

==================================================

1. CORE PRODUCT
   ==================================================

The application is an interactive D&D campaign world/map hub.

Its primary purpose is to allow the GM and players to explore a visual representation of the campaign world.

The application must support:

* A world map.
* City/region maps.
* Zooming and panning.
* Interactive map markers.
* Characters displayed at their locations.
* Locations displayed on maps.
* Clicking a character marker to open their information.
* Character portraits.
* Character descriptions.
* Search.
* Campaign entities.
* GM-managed campaign information.
* Player-created private notes.
* Player-created shared notes.
* Adding/editing characters after the application has been deployed.
* Adding/editing locations after deployment.
* A proper GM administration interface.
* Player accounts.
* GM/player permissions.
* Privacy and authorization for GM-only and player-private information.

The application must be designed as a real application, not a hardcoded demo.

==================================================
2. IMPORTANT PRINCIPLE: DATA MUST BE SEPARATE FROM UI
=====================================================

Do NOT hardcode campaign characters, locations, lore, or map markers directly into React components.

Campaign data must exist in a structured data/database layer.

The UI should consume the data.

I must be able to add a new character later through the application without modifying source code.

For example, after deployment I should be able to:

1. Open the GM dashboard.
2. Click "Add Character".
3. Upload a portrait.
4. Enter the character's name.
5. Enter their description.
6. Add other information.
7. Select their location.
8. Place them on a map if necessary.
9. Save.
10. Have the new character immediately appear in the application.

The same principle applies to locations, factions, quests, and other appropriate entities.

==================================================
3. SOURCE OF TRUTH
==================

The campaign material I provide is the canonical source of truth.

DO NOT invent campaign canon.

If information is missing, do not silently fabricate it and store it as fact.

You may:

* infer technical structure,
* normalize data,
* clean formatting,
* create IDs,
* create database relationships,
* convert supplied information into structured records,
* suggest improvements.

However, do not invent lore, relationships, character traits, locations, history, or other campaign facts.

If something is ambiguous, preserve the ambiguity or flag it for me.

==================================================
4. MAP SYSTEM
=============

The application must support image-based fantasy maps.

The maps I provide may be large raster images.

Do not assume the maps are geographically accurate real-world maps.

Treat them as fictional campaign maps.

The map viewer must support:

* zoom in
* zoom out
* pan
* reset view
* responsive scaling
* marker overlays
* marker selection
* marker labels
* optional fullscreen presentation
* high-resolution maps without unnecessary loss of quality

Markers must be positioned relative to the map rather than using hardcoded screen coordinates.

Prefer normalized coordinates or another resolution-independent coordinate system.

For example:

x = 0.42
y = 0.67

rather than permanently assuming a specific browser width.

The map system must continue to work when:

* the browser is resized,
* the map is displayed on mobile,
* the map is zoomed,
* the map image has a different native resolution.

==================================================
5. MAP HIERARCHY
================

Design the map system so hierarchical maps can exist.

Potential hierarchy:

World
→ Continent
→ Kingdom/Region
→ City
→ District
→ Building
→ Floor
→ Room

Do not require every level to exist.

A campaign may only use:

World → City

or:

World → Country → City → Building.

The system must support different depths.

When appropriate, clicking a location on a higher-level map should allow navigation to its more detailed map.

Example:

World map
→ click Eldoria
→ Eldoria map opens

Eldoria map
→ click Northwatch
→ Northwatch map opens

==================================================
6. CHARACTERS
=============

Characters are first-class entities.

Each character should support at least:

* unique ID
* name
* portrait
* description
* role/title
* faction
* current location
* aliases
* tags
* public information
* GM-only information
* creation date
* modification date
* active/archived state

Do not require every field to be populated.

The schema must be extensible.

Characters must be able to exist without a map marker, because not every character necessarily has a known location.

A character may have:

* exact location
* approximate location
* unknown location
* multiple possible locations
* scheduled locations in a future version

==================================================
7. CHARACTER MAP MARKERS
========================

A character may have a marker on a map.

The marker should be visually distinguishable from ordinary location markers.

Clicking the marker should open a character preview.

The preview should include:

* portrait
* name
* short description
* current location
* relevant public information

Provide an action such as:

"View full profile"

The full profile can contain substantially more information.

The marker should remain correctly positioned when the map is zoomed and resized.

==================================================
8. CHARACTER MANAGEMENT
=======================

The GM must be able to:

* create characters
* edit characters
* archive characters
* restore archived characters
* delete characters when appropriate
* upload/change portraits
* change locations
* place characters on maps
* remove map markers
* edit public information
* edit GM-only information

The GM must not need to edit source code for any of these operations.

==================================================
9. LOCATIONS
============

Locations are first-class entities.

Support fields such as:

* ID
* name
* description
* location type
* parent location
* map
* coordinates
* image
* associated characters
* associated factions
* public information
* GM-only information
* tags
* status
* creation date
* modification date

The location system must be extensible.

==================================================
10. LOCATION MANAGEMENT
=======================

The GM must be able to:

* create locations
* edit locations
* archive locations
* restore locations
* place locations on maps
* move map markers
* change associated maps
* upload location images
* add descriptions
* connect locations to parent locations

Provide a visual placement workflow where possible.

For example:

GM clicks:

"Place on Map"

Then selects the map and clicks the desired position.

The application saves the normalized coordinates.

==================================================
11. FACTIONS
============

Support factions/organizations/guilds.

A faction may contain:

* name
* image/logo
* description
* leader
* members
* associated locations
* allies
* enemies
* public information
* GM-only information
* tags

Do not invent relationships.

Use only supplied campaign information unless the GM later creates the relationship.

==================================================
12. PLAYER CHARACTERS
=====================

Player characters should be distinguishable from NPCs.

Design the data model so that characters can have an owner/player association.

A player should be able to access the information intended for their character.

Do not automatically expose GM-only information.

==================================================
13. PLAYER NOTES — CRITICAL REQUIREMENT
=======================================

Every player must have their own personal notes system.

Player notes are NOT the same as GM campaign notes.

A player must be able to create notes independently.

Examples:

"My suspicion about the Silver Guild."

"Things I need to investigate."

"Session 12 notes."

"The bartender said something strange."

These notes belong to the player who created them.

The GM must NOT automatically see private player notes unless the application explicitly supports a later permission mechanism and the player chooses to share them.

Do not implement private notes as merely hidden UI.

Privacy must be enforced by backend/database authorization.

==================================================
14. NOTE PRIVACY LEVELS
=======================

Support at least these note visibility states:

PRIVATE
SHARED
GM_SHARED, if appropriate

PRIVATE:

Only the author can access it.

SHARED:

Players in the same campaign can access it according to campaign permissions.

GM_SHARED:

The player intentionally shares it with the GM.

The exact terminology can be improved during implementation, but the underlying permission model must be secure.

==================================================
15. NOTES SHOULD SUPPORT ENTITY LINKS
=====================================

A player should be able to associate a note with campaign entities.

For example:

Note:
"The guild seems suspicious."

Linked entity:
Silver Guild

Or:

Note:
"I don't trust this person."

Linked entity:
Arin

Or:

Note:
"Investigate this location."

Linked entity:
Northern Ruins

Support linking notes to:

* characters
* locations
* factions
* quests
* items
* events

A note remains owned by its author regardless of what entity it is attached to.

==================================================
16. NOTE FEATURES
=================

At minimum, notes should support:

* title
* body
* author
* visibility
* creation date
* modification date
* tags
* linked entities

Provide:

* create
* edit
* delete/archive
* search
* filtering
* sorting

Do not overcomplicate the editor in V1.

A clean, reliable text editor is preferable to an enormous feature set.

==================================================
17. QUESTS
==========

Design the architecture so quests can be represented.

Potential fields:

* name
* description
* status
* associated characters
* associated locations
* associated factions
* rewards
* public information
* GM-only information
* tags
* timeline information

Possible statuses:

* not started
* active
* completed
* failed
* unknown

Do not create quests that were not provided by me.

==================================================
18. ITEMS
=========

Design the architecture so important campaign items can be represented later.

Potential fields:

* name
* image
* description
* owner
* location
* history
* properties
* public information
* GM-only information

This does not necessarily need a complete UI in V1 if doing so would significantly increase complexity, but the architecture should not prevent it later.

==================================================
19. EVENTS AND TIMELINE
=======================

Design the system so campaign events can eventually be represented.

Potential fields:

* name
* description
* date
* associated characters
* associated locations
* associated factions
* public information
* GM-only information

Session history should also be possible later.

==================================================
20. GM VS PLAYER PERMISSIONS
============================

This is a critical security requirement.

There must be a clear distinction between:

GM
and
PLAYER.

GM permissions:

* manage campaign
* create/edit/archive characters
* manage locations
* manage factions
* manage maps
* manage quests
* manage campaign content
* see GM-only information
* manage campaign membership
* manage appropriate permissions

Player permissions:

* view permitted campaign content
* create personal notes
* edit personal notes
* delete/archive personal notes
* share notes when explicitly requested
* access their own permitted player information

A player must NEVER be able to access GM-only information by manipulating:

* frontend state
* URLs
* API requests
* browser developer tools
* hidden fields
* JavaScript variables

Authorization must happen server-side/database-side.

==================================================
21. GM SECRETS
==============

The application must support GM-only information.

Example:

Character:
Arin

Public information:
Guildmaster of the Silver Guild.

GM-only information:
[secret]

A player should only receive the public information.

Do not send GM-only information to the browser and merely hide it with CSS.

==================================================
22. AUTHENTICATION
==================

Use a secure authentication system appropriate to the selected architecture.

Users should have:

* account ID
* display name
* campaign membership
* role
* appropriate permissions

A user may eventually belong to more than one campaign.

Do not hardcode users.

==================================================
23. CAMPAIGN MODEL
==================

The application should be campaign-oriented.

Conceptually:

Campaign
├── Users
├── Maps
├── Characters
├── Locations
├── Factions
├── Quests
├── Items
├── Events
└── Notes

Campaign-specific data must be isolated.

Do not allow users from one campaign to accidentally access another campaign's data.

==================================================
24. SEARCH
==========

Implement global search.

Search should eventually be able to find:

* characters
* locations
* factions
* quests
* items
* events
* player's own notes

Search results should indicate entity type.

Example:

SEARCH: Silver

Characters

* Silver Guildmaster

Locations

* Silver Guild

Factions

* Silver Guild

Notes

* My note about Silver Guild

Respect permissions when searching.

A player must not receive search results for GM-only entities/information they are not authorized to see.

==================================================
25. FILTERS
===========

The map should support useful filters.

For example:

Characters
Locations
Factions
Quests
Items

Potential character filters:

* faction
* location
* tags
* status

Do not clutter the interface.

Use progressive disclosure.

==================================================
26. MAP MARKER SYSTEM
=====================

Design a reusable marker system.

Marker types may include:

Character
Location
Faction
Quest
Item
Custom

Markers should support:

* icon
* label
* coordinates
* associated entity
* visibility
* optional category
* optional custom appearance

The system must be extensible.

==================================================
27. MAP EDITOR
==============

Create a GM map editing workflow.

The GM should be able to:

* select a map
* add a marker
* choose entity type
* select an existing entity or create a new one
* place the marker
* drag the marker
* save the position
* remove the marker

If possible, support:

"Add Character Here"

directly from the map.

==================================================
28. ASSET MANAGEMENT
====================

I will provide images and other assets.

Create a sensible asset structure.

Support:

* map images
* character portraits
* location images
* faction images
* item images

The system must not assume filenames are perfect.

Normalize asset references internally.

If using cloud storage, configure it properly and keep database references separate from storage implementation details.

==================================================
29. LARGE MAP PERFORMANCE
=========================

Maps may be large.

Do not unnecessarily load every campaign image at once.

Optimize where practical:

* lazy loading
* appropriate image formats
* responsive images where useful
* caching
* efficient rendering
* avoid rendering thousands of DOM nodes unnecessarily

The map should remain usable on normal laptops and phones.

==================================================
30. UI/UX
=========

The application should feel like a premium fantasy campaign tool, not a generic CRUD dashboard.

However, usability is more important than decoration.

Use:

* clear hierarchy
* excellent typography
* restrained fantasy styling
* strong contrast
* intuitive navigation
* responsive layout
* clean cards
* useful empty states
* clear buttons
* keyboard accessibility
* mobile-friendly controls

Avoid:

* excessive fantasy decoration
* unreadable fonts
* excessive animations
* clutter
* unnecessary modal dialogs
* giant dashboard panels
* poor contrast

The map should remain the visual centerpiece.

==================================================
31. MAIN PLAYER EXPERIENCE
==========================

A player should be able to open the application and quickly understand:

* where they are
* what locations exist
* which characters are visible
* what information is available
* where their personal notes are

A reasonable navigation model could include:

Map
Characters
Locations
Notes
Quests
Search

But use your UX judgment.

==================================================
32. MAIN GM EXPERIENCE
======================

The GM should have an administrative interface.

Potential navigation:

Campaign
Maps
Characters
Locations
Factions
Quests
Players
Notes/Permissions
Settings

Again, use UX judgment rather than blindly copying this structure.

==================================================
33. CHARACTER PROFILE
=====================

Create a polished character profile.

It should support:

Portrait
Name
Title/role
Faction
Location
Description
Relationships
Tags
Public information

GM view may additionally contain:

GM-only information
Secrets
Private campaign notes

Do not expose those fields to unauthorized players.

==================================================
34. LOCATION PROFILE
====================

Location profile should support:

Image
Name
Type
Description
Parent location
Map
Characters
Factions
Related quests
Tags

Again, separate public and GM-only information.

==================================================
35. RESPONSIVE DESIGN
=====================

The application must work on:

* desktop
* laptop
* tablet
* mobile

On mobile:

* navigation should remain usable
* map controls should be touch-friendly
* markers should be selectable
* information panels should adapt appropriately
* notes should be comfortable to edit
* no horizontal page overflow

==================================================
36. ACCESSIBILITY
=================

Implement appropriate accessibility:

* semantic HTML
* keyboard navigation
* visible focus
* accessible buttons
* useful labels
* meaningful alt text
* sufficient contrast
* screen-reader-friendly important information

Do not make the map the only way to access campaign information.

Provide searchable/list-based alternatives where practical.

==================================================
37. DATABASE
============

Choose a sensible relational schema.

At minimum, consider entities/tables for:

users
campaigns
campaign_members
maps
map_markers
characters
locations
factions
quests
items
events
notes
note_links
assets

You may alter the schema if your architecture requires it.

Use foreign keys and proper relationships.

Avoid storing everything as one enormous JSON object.

Use normalized relational structures where appropriate.

==================================================
38. EXTENSIBILITY
=================

The application must be designed so additional systems can be added later.

Possible future systems:

* session tracking
* initiative tracker
* combat tools
* inventory
* character sheets
* timeline
* NPC schedules
* relationship graphs
* campaign journal
* dice tools
* player handouts
* secrets
* faction reputation
* weather
* world-state tracking

Do NOT implement all of these now.

Build a clean foundation that does not make them impossible later.

==================================================
39. TECHNOLOGY
==============

Choose the most appropriate modern stack.

A preferred starting point is:

Frontend:
Next.js
React
TypeScript

Backend:
Next.js server functionality or an appropriate backend

Database:
PostgreSQL

Authentication/storage:
A secure managed solution such as Supabase may be used if appropriate.

Styling:
Use a modern, maintainable styling system.

Map:
Use an appropriate image/canvas/SVG-based map implementation for fictional raster maps.

Do not use geographic mapping libraries intended for real-world GIS unless there is a concrete reason.

The maps are fictional D&D artwork.

If you determine a different stack is materially better, explain the decision briefly and implement it.

==================================================
40. AI DEVELOPMENT BEHAVIOR
===========================

You are operating as the development agent.

Do not ask me to manually write code that you can reasonably write yourself.

Do not stop after creating a plan.

Do not generate fake placeholder functionality and claim the feature is complete.

If something can be implemented, implement it.

If something cannot yet be implemented because required information is missing, create the appropriate architecture and clearly identify the exact missing input.

When I provide assets, inspect them carefully.

Infer:

* image dimensions
* file types
* probable map relationships
* character assets
* naming relationships
* duplicate files
* missing references

Do not invent missing campaign facts.

==================================================
41. DATA IMPORT
===============

Because I will provide campaign information in potentially messy formats, create a robust ingestion process.

I may provide:

* Markdown
* TXT
* JSON
* images
* folders
* PDFs
* spreadsheets
* manually written notes

Normalize the information into the application's data model.

Do not destroy the original meaning.

If two pieces of information conflict, do not silently choose one.

Flag the conflict.

==================================================
42. INITIAL CAMPAIGN IMPORT
===========================

When I provide the initial campaign data:

1. Inventory the assets.
2. Identify maps.
3. Identify characters.
4. Identify locations.
5. Identify factions.
6. Identify quests.
7. Identify other entities.
8. Identify relationships.
9. Identify map/location associations.
10. Identify missing information.
11. Design the schema.
12. Implement the application.
13. Import the data.
14. Connect entities.
15. Place known map markers.
16. Build the player experience.
17. Build the GM experience.
18. Test permissions.
19. Test responsive behavior.
20. Test map interactions.
21. Fix discovered problems.

==================================================
43. MAP COORDINATES
===================

Do not make me manually calculate pixel coordinates unless absolutely necessary.

Where feasible, provide an admin interface allowing me to visually place markers.

Store positions in a resolution-independent manner.

If a map is 2000×1200, a position should conceptually be stored as:

x = 0.5
y = 0.4

rather than:

x = 1000
y = 480

This makes the system resilient to different rendering sizes.

==================================================
44. FUTURE CHARACTER ADDITION
=============================

This requirement is mandatory.

After the initial project is complete, I must be able to add:

Name:
[ ]

Portrait:
[Upload]

Description:
[ ]

Location:
[Select]

Map:
[Select]

Position:
[Place on map]

Public information:
[ ]

GM-only information:
[ ]

Save

After saving, the character must become a normal campaign entity.

No source-code changes should be required.

==================================================
45. FUTURE LOCATION ADDITION
============================

Likewise, I must be able to add new locations after deployment.

The same principle applies to:

* factions
* quests
* items
* events

where those features are implemented.

==================================================
46. PLAYER NOTES REQUIREMENT
============================

Player notes must remain independent from GM campaign data.

For example:

GM database:

Silver Guild
Description:
The Silver Guild is...

Player 1:

"My note:
The guild seems suspicious."

Player 2:

"My note:
Ask Arin about the guild."

These are separate.

Player 1 must not automatically see Player 2's private note.

The GM must not automatically see either player's private note.

If a player chooses "Share with GM", then that note can become visible to the GM according to the permission model.

==================================================
47. SECURITY
============

Treat security as a first-class requirement.

Protect against:

* unauthorized campaign access
* unauthorized GM information access
* unauthorized note access
* insecure direct object references
* client-side-only authorization
* privilege escalation
* cross-campaign data access

Never assume that hiding an element in the frontend provides security.

Validate authorization at the backend/database layer.

==================================================
48. TESTING
===========

Before considering the application complete, test at least:

Authentication
Authorization
GM access
Player access
Private notes
Shared notes
GM-only data
Character creation
Character editing
Character deletion/archive
Location creation
Location editing
Map marker creation
Map marker movement
Map zoom
Map pan
Responsive layout
Search
Image uploads
Large maps
Empty states
Missing images
Missing locations
Unknown character locations
Invalid input
Unauthorized requests

Fix bugs you discover.

==================================================
49. ERROR HANDLING
==================

The application must handle:

* missing images
* deleted entities
* missing coordinates
* unknown locations
* invalid data
* failed uploads
* database errors
* unauthorized access
* network errors

Do not display raw technical errors to ordinary users.

Provide useful human-readable messages.

==================================================
50. DATA INTEGRITY
==================

Avoid orphaned records.

If a character's location is deleted:

Do not leave a broken marker.

Either:

* require reassignment,
* remove the relationship safely,
* or mark the location as unavailable.

Use appropriate database constraints.

==================================================
51. ARCHIVING
=============

Prefer archiving campaign entities rather than permanently deleting them where historical preservation is useful.

For example:

Character:
status = archived

rather than immediately destroying all historical references.

Use permanent deletion only when appropriate.

==================================================
52. DESIGN PHILOSOPHY
=====================

The product should feel like:

"An interactive living atlas of the campaign."

Not:

"A website with a background image and some buttons."

The map is the spatial interface.

The database is the source of truth.

The profiles are the information layer.

The notes are the player's personal knowledge layer.

The GM dashboard is the campaign management layer.

==================================================
53. DO NOT OVERENGINEER V1
==========================

Build the foundation correctly, but do not implement every possible future feature.

Prioritize:

1. Authentication
2. Campaign
3. Maps
4. Map navigation
5. Characters
6. Locations
7. Character/location markers
8. Character profiles
9. GM management
10. Player notes
11. Permissions
12. Search

Then expand.

==================================================
54. VISUAL QUALITY
==================

The final UI should be polished.

Do not settle for:

* default browser styling
* generic CRUD tables everywhere
* ugly forms
* inconsistent spacing
* excessive rounded cards
* excessive gradients
* placeholder-looking UI
* unnecessary animations

The application should feel cohesive.

Use the campaign maps and character art as the visual identity of the product.

==================================================
55. DEVELOPMENT WORKFLOW
========================

Follow this workflow:

PHASE 1:
Inspect all supplied material.

PHASE 2:
Create an inventory of assets and information.

PHASE 3:
Design the domain model.

PHASE 4:
Design the database schema.

PHASE 5:
Implement authentication and authorization.

PHASE 6:
Implement campaign structure.

PHASE 7:
Implement map system.

PHASE 8:
Implement characters and locations.

PHASE 9:
Implement map markers.

PHASE 10:
Implement GM management.

PHASE 11:
Implement player notes and privacy.

PHASE 12:
Implement search.

PHASE 13:
Import campaign content.

PHASE 14:
Test.

PHASE 15:
Fix bugs and polish.

Do not prematurely optimize or build future features before the foundation works.

==================================================
56. IMPORTANT: USE THE PROVIDED CONTENT
=======================================

I will provide the actual campaign information after this specification.

Do not replace my campaign content with lorem ipsum.

Do not create fake characters merely to demonstrate the application once the real data is available.

Use my actual:

* maps
* character images
* descriptions
* locations
* factions
* lore
* campaign information

when implementing the initial version.

==================================================
57. FINAL DELIVERABLE
=====================

The final result should be a working application.

I should be able to:

GM:

* log in
* open the campaign
* view the world
* navigate maps
* see characters
* click characters
* view information
* add characters
* upload character portraits
* edit characters
* place characters on maps
* add locations
* edit locations
* manage campaign information
* manage appropriate permissions

PLAYER:

* log in
* view the campaign
* explore maps
* click visible characters
* view permitted information
* search
* create private notes
* edit private notes
* organize notes
* link notes to characters/locations/etc.
* optionally share notes according to the permission model

The system must preserve the distinction between:

GM data
Player-private data
Player-shared data
Public campaign data

==================================================
58. WHEN YOU NEED TO MAKE A DECISION
====================================

Use engineering judgment.

Prefer:

* simplicity
* maintainability
* security
* extensibility
* performance
* excellent UX

over unnecessary complexity.

If there are multiple technically valid solutions, choose the one that provides the strongest long-term foundation without making V1 unnecessarily complicated.

Do not ask me to make technical decisions that you can reasonably make yourself.

==================================================
59. BEFORE FINALIZING
=====================

Perform a complete review of:

Architecture
Database
Security
Authorization
Map system
Asset handling
Character system
Location system
Notes
Responsive UI
Search
Error handling
Data integrity
Performance
Accessibility

Then fix problems found during the review.

The application should be treated as a real software project.

I will provide the campaign assets and information separately.

Once I provide them, begin by inspecting and organizing the material, then proceed with implementation.