# Change Log

## Upcoming RC

- Log from Creatio
- Feature comparison
- Install multiple apps from Marketplace (savable scenario ?)
  - Download all, repack, send to Creatio;

---

- Welcome journey
- Edit existing connection
- Edit SourceCodeSchema (CS, JS, SQL)
  - Implement [FileSystemProvider] for CS, JS, SQL
  - Open other schemas in in Creatio
- WebSocket nlog appender

# PRTNER RELEASE

- **NoCode+real code collaboration**

## [0.0.9] Initial release  - Oct ???, 2022

### Added

- Set global `feature` state
- Set `feature` state for current user
- WebSocket listener

### Changed

- Made sql table columns selectable on double click

### Bug Fix

- Fixed disappearing marketplace panel
- Fixed spelling on Lock/Unlock command


## [0.0.8] Initial release  - Oct 6, 2022

### Added

- Sow list of packages for an environment
- Lock / Unlock package
- Preview (readonly) CS, JS and SQL schemas
- Preview (readonly) App features

### Changed

- SQL Grid to [AG Grid][ag-grid]
- List Features
- .vscodeignore to remove `webview-ui/.angular` folder from extension vsix file
- `Install/Update clio` with `--no-cache` option


## [0.0.7] Initial release  - Sep 22, 2022

### Added

- Added `Install/Update clio` option
- Added `Restore configuration` option
- Added `Install package` option

### Changed

- FlushDb, Restart, Ping command to utilize CreatioClient

## [0.0.6] Initial release  - Sep 20, 2022

### Added

- Add and remove connection
- Clear redis
- Restart webapp
- Execute sql

#
<!-- Named links -->
[ag-grid]:https://ag-grid.com
[FileSystemProvider]:https://code.visualstudio.com/api/references/vscode-api#FileSystemProvider