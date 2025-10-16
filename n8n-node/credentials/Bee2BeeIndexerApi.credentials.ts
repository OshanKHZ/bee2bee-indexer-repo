import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class Bee2BeeIndexerApi implements ICredentialType {
	name = 'bee2BeeIndexerApi';
	displayName = 'Bee2Bee Indexer API';
	documentationUrl = 'https://docs.bee2bee.ai';
	properties: INodeProperties[] = [
		{
			displayName: 'GitHub Token',
			name: 'githubToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'GitHub Personal Access Token for downloading repositories',
		},
		{
			displayName: 'OpenAI API Key',
			name: 'openaiApiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'OpenAI API Key for embeddings (leave empty to use local models)',
		},
		{
			displayName: 'Embedding Provider',
			name: 'embeddingProvider',
			type: 'options',
			options: [
				{
					name: 'Local (Free)',
					value: 'local',
				},
				{
					name: 'OpenAI (Paid)',
					value: 'openai',
				},
			],
			default: 'local',
			description: 'Which embedding provider to use',
		},
	];

	// No authentication needed for this node - it uses the credentials for external APIs
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.github.com',
			url: '/user',
			headers: {
				Authorization: '=Bearer {{$credentials.githubToken}}',
			},
		},
	};
}
