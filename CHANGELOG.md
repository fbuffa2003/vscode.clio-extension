# Change Log

## Upcoming RC

- Log from Creatio
- Welcome journey
- Edit existing connection
- Save live logs to file

# PRTNER RELEASE

- **NoCode+real code collaboration**


## [0.0.12] release  - Nov 03, 2022

### Added

- Automatically check for the latest clio version on NuGet, compare to currently installed, suggest update when available. Compatible with clio 3.0.1.36 and up
- Prevented multiple execution of getPackages per environment;

### Bug Fix

- Stop live logging in webview dispose
- Fixed open folder path when downloading package

## [0.0.11] release  - Oct 27, 2022

### Added

- OAuth support
- Edit SourceCodeSchema (CS, JS, SQL), implemented FileSystemProvider
- Added option to install multiple applications
- Open other schemas in Creatio

## [0.0.10] release  - Oct 20, 2022

### Added

- Live logging / WebSocket nlog appender (see clio gate release ver: 3.0.1.33)

## [0.0.9] release  - Oct 13, 2022

### Changed

- Made sql table columns selectable on double click

### Bug Fix

- Fixed disappearing marketplace panel
- Fixed spelling on Lock/Unlock command


## [0.0.8] release  - Oct 6, 2022

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


## [0.0.7] release  - Sep 22, 2022

### Added

- Added `Install/Update clio` option
- Added `Restore configuration` option
- Added `Install package` option

### Changed

- FlushDb, Restart, Ping command to utilize CreatioClient

## [0.0.6] release  - Sep 20, 2022

### Added

- Add and remove connection
- Clear redis
- Restart webapp
- Execute sql

#
<!-- Named links -->
[ag-grid]:https://ag-grid.com
[FileSystemProvider]:https://code.visualstudio.com/api/references/vscode-api#FileSystemProvider