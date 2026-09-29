# Gatekeeper game prototype

The existing story's correct answer opens `GatekeeperGame`. Completion opens the existing Google login view. Skip remains a React control outside the game.

- `GatekeeperGame.tsx`: React UI, lazy browser import, callback bridge and unmount cleanup.
- `createGame.ts`: Phaser Canvas instance, FIT scaling, parent resize observer and typed commands.
- `scenes/GatekeeperScene.ts`: input and scene lifecycle; publishes state/completion events.
- `state.ts`: pure rules for idle → playing → success or failure → retry.
- `PlaceholderView.ts`: replaceable visuals. Replace these shapes with spritesheets/animations without changing the rules or callback contract. Future audio/particles belong to the presentation/scene lifecycle; audio is disabled in this prototype.

The prototype starts explicitly. Activate the seal three times to succeed. A click/tap outside the seal fails the attempt. Retry resets progress. A React button provides equivalent keyboard input. There is no automatic movement or flashing, including under reduced motion.

`gatekeeper:state` updates React's status. `gatekeeper:complete` fires once after a short success pause and invokes `onComplete`. React can instead advance to any future gatekeeper step. React sends `start()` and `activate()` commands through the returned handle.

Phaser 3.90.0 is pinned. It is imported only in the mounted component effect, after Next's client-only dynamic component is shown. Authenticated pages do not render that component. Cleanup cancels a pending import, disconnects ResizeObserver, removes bridge listeners and calls `game.destroy(true)` to release the instance on the next frame. Phaser's global plugins remain reusable for a later instance.
