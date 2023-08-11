import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, Stat } from 'obsidian';
import { AllCanvasNodeData, CanvasData, CanvasFileData } from "obsidian/canvas";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	canvasName: string;
	groupName: string;
	journalDir: string;
}

interface NodeCoordinate {
	x1: number;
	x2: number;
	y1: number;
	y2: number;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	canvasName: 'Daily.canvas',
	groupName: `Daily`,
	journalDir: '',
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		
		const updateCanvas = async () => {
			// const file = await this.app.vault.create('nuuuu.md', '# Hello World!');
			// console.log(file)

			const today = new Date();
			
			const formattedDate = today.getFullYear() + "-" + (today.getMonth() + 1).toString().padStart(2, '0') + "-" + today.getDate().toString().padStart(2, '0');

			

			console.log("formatted: ", formattedDate);
			
			const files = this.app.vault.getFiles();

			const canvas = files.find(file => file.name === this.settings.canvasName);

			const handleEmptyCanvas = () => {
				const data: CanvasData = {
					nodes: [],
					edges: [],
				};
				return data;
			};

			const getCanvasContents = async (file: TFile): Promise<CanvasData> => {
				const fileContents = await this.app.vault.read(file);
				if (!fileContents) {
					return handleEmptyCanvas();
				}
				const canvasData = JSON.parse(fileContents) as CanvasData;
				return canvasData;
			};
	
			if(canvas !== undefined) {
				console.log("canvas found", canvas)
				const canvasData = await getCanvasContents(canvas);

				console.log("canvas data:", canvasData)

				const groupNode = canvasData.nodes.find(node => node.label === this.settings.groupName && node.type === "group")

				let nodesInGroup : AllCanvasNodeData[] = []
				
				if(groupNode){
					const groupCoordinate : NodeCoordinate = {
						x1: groupNode.x,
						x2: groupNode.x + groupNode.width,
						y1: groupNode.y,
						y2: groupNode.y + groupNode.height
					}

					canvasData.nodes.forEach((node) => {
						// checks if node is in group
						if(node.x > groupCoordinate.x1 && node.x + node.width < groupCoordinate.x2 && node.y > groupCoordinate.y1 && node.y + node.height < groupCoordinate.y2){
							nodesInGroup.push(node)
						}
					})

					console.log("nodes in group: ", nodesInGroup)

					nodesInGroup.forEach((node) => {
						canvasData.nodes.remove(node);
						node.file = `${this.settings.journalDir}${formattedDate}.md`;
						canvasData.nodes.push(node);
					})

					const fileContents = JSON.stringify(canvasData);
					await this.app.vault.modify(canvas, fileContents);
				}

				// should be optional, can acts as a homepage

				// const leaf = this.app.workspace.getLeaf();
				// await leaf.openFile(canvas, { active: true });
			}
		}
		
		this.app.workspace.onLayoutReady(() => {
			updateCanvas();

		})
		console.log('hello console')


		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Canvas Name')
			.setDesc('Canvas to update')
			.addText(text => text
				.setPlaceholder('Daily.canvas')
				.setValue(this.plugin.settings.canvasName)
				.onChange(async (value) => {
					this.plugin.settings.canvasName = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
		.setName('Group Name')
		.setDesc('Name of the group containing daily nodes')
		.addText(text => text
			.setPlaceholder('Daily')
			.setValue(this.plugin.settings.groupName)
			.onChange(async (value) => {
				this.plugin.settings.groupName = value;
				await this.plugin.saveSettings();
			}));

		new Setting(containerEl)
		.setName('Journal Directory')
		.setDesc('Directory of the Daily Journal file')
		.addText(text => text
			.setPlaceholder('Journal/')
			.setValue(this.plugin.settings.journalDir)
			.onChange(async (value) => {
				this.plugin.settings.journalDir = value;
				await this.plugin.saveSettings();
			}));
	}
}
