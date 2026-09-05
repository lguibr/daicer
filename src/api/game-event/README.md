# Stored game events

GameEvent retains the legacy event enum and payload contract. The deterministic
player lifecycle archives its versioned kernel events in Turn metadata instead.

`timeFrames` owns the many-to-many relation whose inverse is `TimeFrame.events`.
Both sides must be present: Strapi deep-populates document events after commit,
including snapshots that have no linked legacy events. A missing owning relation
leaves join-table metadata undefined and can crash that asynchronous population.

Schema synchronization adds the missing join table without deleting existing
events or snapshots. This repair does not reconstruct historical associations
that the broken relation could not persist.
