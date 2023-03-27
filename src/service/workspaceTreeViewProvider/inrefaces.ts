import { mySemVer } from '../../utilities/mySemVer';

export interface IWorkspaceSettings {
	ApplicationVersion: mySemVer
	Packages: Array<string>
}

export interface IWorkspaceEnvironmentSettings {
	Environment: string | undefined
}