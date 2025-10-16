import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

// Helper function to call Python CLI
async function indexRepository(params: {
	owner: string;
	repo: string;
	branch: string;
	githubToken: string;
	openaiApiKey: string;
	embeddingProvider: string;
	outputFormat: string;
	maxFiles: number;
	fileExtensions: string[];
	excludePatterns: string[];
	includeDocstrings: boolean;
	chunkStrategy: string;
}): Promise<IDataObject> {
	const {
		owner,
		repo,
		branch,
		githubToken,
		openaiApiKey,
		embeddingProvider,
		outputFormat,
		maxFiles,
		fileExtensions,
		excludePatterns,
		includeDocstrings,
		chunkStrategy,
	} = params;

	// Call Python CLI
	const { spawn } = require('child_process');
	const path = require('path');

	// Find the Python CLI script (assumes it's in the parent directory of n8n-node)
	const cliPath = path.join(__dirname, '../../../cli.py');

	// Prepare config for Python CLI
	const config = {
		owner,
		repo,
		branch,
		githubToken,
		openaiApiKey,
		embeddingProvider,
		outputFormat,
		maxFiles,
		fileExtensions,
		excludePatterns,
		includeDocstrings,
		chunkStrategy,
	};

	return new Promise((resolve, reject) => {
		// Spawn Python process
		const python = spawn('python', [cliPath]);

		let stdout = '';
		let stderr = '';

		// Collect stdout
		python.stdout.on('data', (data: Buffer) => {
			stdout += data.toString();
		});

		// Collect stderr
		python.stderr.on('data', (data: Buffer) => {
			stderr += data.toString();
		});

		// Handle completion
		python.on('close', (code: number) => {
			if (code !== 0) {
				// Try to parse error JSON from stdout
				try {
					const errorResult = JSON.parse(stdout);
					reject(new Error(errorResult.error || stderr));
				} catch {
					reject(new Error(`Python CLI failed: ${stderr}`));
				}
				return;
			}

			try {
				const result = JSON.parse(stdout);
				resolve(result);
			} catch (error: any) {
				reject(new Error(`Failed to parse Python CLI output: ${error.message}`));
			}
		});

		// Send config via stdin
		python.stdin.write(JSON.stringify(config));
		python.stdin.end();
	});
}

export class Bee2BeeIndexer implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Bee2Bee Indexer',
		name: 'bee2BeeIndexer',
		icon: 'file:bee2bee.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Index GitHub repositories and generate embeddings for RAG',
		defaults: {
			name: 'Bee2Bee Indexer',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'bee2BeeIndexerApi',
				required: true,
			},
		],
		properties: [
			// Operation
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Index Repository',
						value: 'indexRepo',
						description: 'Download and index a GitHub repository',
						action: 'Index a GitHub repository',
					},
				],
				default: 'indexRepo',
			},
			// Repository Owner
			{
				displayName: 'Repository Owner',
				name: 'owner',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['indexRepo'],
					},
				},
				description: 'GitHub repository owner (user or organization)',
				placeholder: 'facebook',
			},
			// Repository Name
			{
				displayName: 'Repository Name',
				name: 'repo',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['indexRepo'],
					},
				},
				description: 'GitHub repository name',
				placeholder: 'react',
			},
			// Branch
			{
				displayName: 'Branch',
				name: 'branch',
				type: 'string',
				default: 'main',
				required: true,
				displayOptions: {
					show: {
						operation: ['indexRepo'],
					},
				},
				description: 'Git branch to index',
				placeholder: 'main',
			},
			// Output Format
			{
				displayName: 'Output Format',
				name: 'outputFormat',
				type: 'options',
				options: [
					{
						name: 'Full (Metadata + Chunks + Embeddings)',
						value: 'full',
						description: 'Complete output with all data',
					},
					{
						name: 'Chunks + Embeddings',
						value: 'chunks_embeddings',
						description: 'Only code chunks with their embeddings',
					},
					{
						name: 'Metadata Only',
						value: 'metadata',
						description: 'Only repository metadata and statistics',
					},
					{
						name: 'Chunks Only',
						value: 'chunks',
						description: 'Only code chunks without embeddings',
					},
				],
				default: 'full',
				displayOptions: {
					show: {
						operation: ['indexRepo'],
					},
				},
				description: 'What data to include in the output',
			},
			// Additional Options
			{
				displayName: 'Additional Options',
				name: 'additionalOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						operation: ['indexRepo'],
					},
				},
				options: [
					{
						displayName: 'Max Files',
						name: 'maxFiles',
						type: 'number',
						default: 0,
						description: 'Maximum number of files to process (0 = no limit)',
					},
					{
						displayName: 'File Extensions',
						name: 'fileExtensions',
						type: 'string',
						default: '.py,.js,.ts,.tsx,.jsx,.rs,.go,.java,.c,.cpp',
						description: 'Comma-separated list of file extensions to include',
						placeholder: '.py,.js,.ts',
					},
					{
						displayName: 'Exclude Patterns',
						name: 'excludePatterns',
						type: 'string',
						default: 'node_modules,dist,build,__pycache__,.git',
						description: 'Comma-separated list of directory patterns to exclude',
						placeholder: 'node_modules,dist,tests',
					},
					{
						displayName: 'Include Docstrings',
						name: 'includeDocstrings',
						type: 'boolean',
						default: true,
						description: 'Whether to extract and include docstrings/comments',
					},
					{
						displayName: 'Chunk Size Strategy',
						name: 'chunkStrategy',
						type: 'options',
						options: [
							{
								name: 'Function Level',
								value: 'function',
								description: 'One chunk per function/method',
							},
							{
								name: 'Class Level',
								value: 'class',
								description: 'One chunk per class',
							},
							{
								name: 'File Level',
								value: 'file',
								description: 'One chunk per file',
							},
						],
						default: 'function',
						description: 'How to split code into chunks',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];

		// Get credentials
		const credentials = await this.getCredentials('bee2BeeIndexerApi');
		const githubToken = credentials.githubToken as string;
		const openaiApiKey = credentials.openaiApiKey as string || '';
		const embeddingProvider = credentials.embeddingProvider as string || 'local';

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				if (operation === 'indexRepo') {
					// Get parameters
					const owner = this.getNodeParameter('owner', i) as string;
					const repo = this.getNodeParameter('repo', i) as string;
					const branch = this.getNodeParameter('branch', i) as string;
					const outputFormat = this.getNodeParameter('outputFormat', i) as string;
					const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as IDataObject;

					// Extract additional options
					const maxFiles = additionalOptions.maxFiles as number || 0;
					const fileExtensions = (additionalOptions.fileExtensions as string || '.py,.js,.ts,.tsx').split(',').map(e => e.trim());
					const excludePatterns = (additionalOptions.excludePatterns as string || 'node_modules,dist').split(',').map(p => p.trim());
					const includeDocstrings = additionalOptions.includeDocstrings !== false;
					const chunkStrategy = additionalOptions.chunkStrategy as string || 'function';

					// Call Python indexer
					const result = await indexRepository({
						owner,
						repo,
						branch,
						githubToken,
						openaiApiKey,
						embeddingProvider,
						outputFormat,
						maxFiles,
						fileExtensions,
						excludePatterns,
						includeDocstrings,
						chunkStrategy,
					});

					returnData.push(result);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
						},
					});
					continue;
				}
				throw error;
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}
