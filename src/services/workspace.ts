/**
 * Google Workspace Service
 * Implements client-side calls to Google Drive, Google Sheets, Gmail, Google Forms, and People (Contacts) APIs.
 */

// Helper: base64url encode for Gmail RFC 2822 messages
function base64UrlEncode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// 1. Google Drive APIs
export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
}

export async function listDriveFiles(token: string): Promise<DriveFileItem[]> {
  const url = 'https://www.googleapis.com/drive/v3/files?pageSize=25&fields=files(id,name,mimeType,modifiedTime,size,webViewLink)&orderBy=modifiedTime desc';
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch Drive files (${res.status})`);
  }
  const data = await res.json();
  return data.files || [];
}

export async function uploadFileToDrive(
  token: string,
  name: string,
  mimeType: string,
  content: string | Blob
): Promise<DriveFileItem> {
  const metadata = {
    name,
    mimeType,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  if (typeof content === 'string') {
    form.append('file', new Blob([content], { type: mimeType }));
  } else {
    form.append('file', content);
  }

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to upload to Drive (${res.status})`);
  }
  return await res.json();
}

export async function deleteDriveFile(token: string, fileId: string): Promise<boolean> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete Drive file (${res.status})`);
  }
  return true;
}

// 2. Google Sheets APIs
export interface SpreadsheetSummary {
  id: string;
  name: string;
  webViewLink?: string;
}

export async function listSpreadsheets(token: string): Promise<SpreadsheetSummary[]> {
  const q = encodeURIComponent("mimeType = 'application/vnd.google-apps.spreadsheet'");
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&pageSize=20&fields=files(id,name,webViewLink)&orderBy=modifiedTime desc`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to list spreadsheets');
  }
  const data = await res.json();
  return data.files || [];
}

export async function createSpreadsheet(
  token: string,
  title: string,
  headers: string[],
  rows: (string | number)[][]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  // Create empty spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create Google Sheet');
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl;

  // Insert header and initial rows
  const allValues = [headers, ...rows];
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: allValues }),
    }
  );

  return { spreadsheetId, spreadsheetUrl };
}

function sanitizeCell(val: string | number): string | number {
  if (typeof val === 'string' && (val.startsWith('+') || val.startsWith('='))) {
    return `'${val}`;
  }
  return val;
}

export async function appendSpreadsheetRows(
  token: string,
  spreadsheetId: string,
  range: string,
  rows: (string | number)[][]
): Promise<any> {
  const sanitizedRows = rows.map((row) => row.map(sanitizeCell));
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      range
    )}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: sanitizedRows }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to append rows to Google Sheet');
  }
  return await res.json();
}

export async function getSpreadsheetInfo(
  token: string,
  spreadsheetId: string
): Promise<{ title: string; sheets: string[]; spreadsheetUrl: string }> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties.title,spreadsheetUrl`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch spreadsheet info (${res.status})`);
  }
  const data = await res.json();
  const title = data.properties?.title || 'Google Sheet';
  const sheets = (data.sheets || []).map((s: any) => s.properties?.title || 'Sheet1');
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  return { title, sheets, spreadsheetUrl };
}

export async function readSpreadsheetValues(
  token: string,
  spreadsheetId: string,
  range: string
): Promise<(string | number)[][]> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to read rows from Google Sheet');
  }
  const data = await res.json();
  return data.values || [];
}

export async function batchUpdateSpreadsheetValues(
  token: string,
  spreadsheetId: string,
  data: Array<{ range: string; values: (string | number)[][] }>
): Promise<any> {
  const sanitizedData = data.map((item) => ({
    range: item.range,
    values: item.values.map((row) => row.map(sanitizeCell)),
  }));
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: sanitizedData,
      }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to update Google Sheet values');
  }
  return await res.json();
}

export interface MasterTabConfig {
  title: string;
  tabColor: { red: number; green: number; blue: number };
  headers: string[];
  rows: (string | number)[][];
}

export async function createMultiTabMasterSpreadsheet(
  token: string,
  spreadsheetTitle: string,
  tabs: MasterTabConfig[]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  // 1. Create spreadsheet with pre-defined colored tabs
  const sheetsPayload = tabs.map((tab) => ({
    properties: {
      title: tab.title,
      tabColor: tab.tabColor,
    },
  }));

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title: spreadsheetTitle },
      sheets: sheetsPayload,
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create Master ERP Google Sheet');
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl;

  // 2. Batch write headers and rows to all tabs
  const batchData = tabs.map((tab) => ({
    range: `${tab.title}!A1`,
    values: [tab.headers, ...tab.rows],
  }));

  await batchUpdateSpreadsheetValues(token, spreadsheetId, batchData);

  return { spreadsheetId, spreadsheetUrl };
}

export async function ensureTabsExistInSpreadsheet(
  token: string,
  spreadsheetId: string,
  tabs: Array<{ title: string; tabColor?: { red: number; green: number; blue: number } }>
): Promise<string[]> {
  try {
    const info = await getSpreadsheetInfo(token, spreadsheetId);
    const existingTitles = new Set(info.sheets);
    const missingTabs = tabs.filter((t) => !existingTitles.has(t.title));

    if (missingTabs.length > 0) {
      const requests = missingTabs.map((tab) => ({
        addSheet: {
          properties: {
            title: tab.title,
            tabColor: tab.tabColor || { red: 0.3, green: 0.5, blue: 0.8 },
          },
        },
      }));

      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests }),
      });
    }

    return [...existingTitles, ...missingTabs.map((t) => t.title)];
  } catch (err) {
    console.warn('Could not auto-verify/add tabs:', err);
    return [];
  }
}

export async function syncAllERPDataToSheet(
  token: string,
  spreadsheetId: string,
  tabs: MasterTabConfig[]
): Promise<any> {
  // 1. Ensure all requested tabs exist in the target spreadsheet
  await ensureTabsExistInSpreadsheet(token, spreadsheetId, tabs);

  // 2. Clear old data or overwrite from A1
  const batchData = tabs.map((tab) => ({
    range: `${tab.title}!A1`,
    values: [tab.headers, ...tab.rows],
  }));

  return await batchUpdateSpreadsheetValues(token, spreadsheetId, batchData);
}

export async function readAllERPDataFromSheet(
  token: string,
  spreadsheetId: string,
  tabNames: string[]
): Promise<Record<string, (string | number)[][]>> {
  const ranges = tabNames.map((tab) => encodeURIComponent(`${tab}!A1:Z500`));
  const rangesQuery = ranges.map((r) => `ranges=${r}`).join('&');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${rangesQuery}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to read backup data from Google Sheets');
  }

  const data = await res.json();
  const result: Record<string, (string | number)[][]> = {};

  (data.valueRanges || []).forEach((vr: any, idx: number) => {
    const tabName = tabNames[idx] || `Sheet${idx + 1}`;
    result[tabName] = vr.values || [];
  });

  return result;
}

// 3. Gmail APIs
export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet?: string;
  subject?: string;
  from?: string;
  date?: string;
}

export async function listGmailMessages(token: string): Promise<GmailMessageSummary[]> {
  const url = 'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10';
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to list Gmail messages');
  }
  const data = await res.json();
  const messageRefs: Array<{ id: string; threadId: string }> = data.messages || [];

  const details: GmailMessageSummary[] = await Promise.all(
    messageRefs.slice(0, 8).map(async (msg) => {
      try {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!detailRes.ok) return { id: msg.id, threadId: msg.threadId, snippet: '' };
        const detail = await detailRes.json();
        const headers = detail.payload?.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
        const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || '';
        const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';
        return {
          id: msg.id,
          threadId: msg.threadId,
          snippet: detail.snippet || '',
          subject,
          from,
          date,
        };
      } catch {
        return { id: msg.id, threadId: msg.threadId };
      }
    })
  );

  return details;
}

export async function sendGmailMessage(
  token: string,
  to: string,
  subject: string,
  body: string
): Promise<{ id: string; threadId: string }> {
  const rawEmail = [
    `To: ${to}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    '',
    body,
  ].join('\r\n');

  const encoded = base64UrlEncode(rawEmail);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encoded }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to send email via Gmail (${res.status})`);
  }

  return await res.json();
}

// 4. Google Forms APIs
export interface FormItem {
  id: string;
  name: string;
  webViewLink?: string;
}

export async function listGoogleForms(token: string): Promise<FormItem[]> {
  const q = encodeURIComponent("mimeType = 'application/vnd.google-apps.form'");
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&pageSize=20&fields=files(id,name,webViewLink)&orderBy=modifiedTime desc`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to list Google Forms');
  }
  const data = await res.json();
  return data.files || [];
}

export async function createGoogleForm(
  token: string,
  title: string
): Promise<{ formId: string; responderUri: string }> {
  const res = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      info: {
        title,
        documentTitle: title,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create Google Form');
  }

  const data = await res.json();
  return {
    formId: data.formId,
    responderUri: data.responderUri,
  };
}

export async function getFormResponses(token: string, formId: string): Promise<any> {
  const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to get form responses');
  }
  return await res.json();
}

// 5. Google Contacts (People API)
export interface ContactPerson {
  resourceName: string;
  name: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
}

export async function listGoogleContacts(token: string): Promise<ContactPerson[]> {
  const url =
    'https://people.googleapis.com/v1/people/me/connections?pageSize=50&personFields=names,emailAddresses,phoneNumbers,organizations';
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to list Google Contacts');
  }
  const data = await res.json();
  const connections: any[] = data.connections || [];

  return connections.map((c) => ({
    resourceName: c.resourceName,
    name: c.names?.[0]?.displayName || '(Unnamed Contact)',
    email: c.emailAddresses?.[0]?.value || '',
    phone: c.phoneNumbers?.[0]?.value || '',
    jobTitle: c.organizations?.[0]?.title || '',
  }));
}

export async function createGoogleContact(
  token: string,
  givenName: string,
  familyName: string,
  email?: string,
  phone?: string,
  jobTitle?: string
): Promise<ContactPerson> {
  const body: any = {
    names: [{ givenName, familyName }],
  };
  if (email) body.emailAddresses = [{ value: email, type: 'work' }];
  if (phone) body.phoneNumbers = [{ value: phone, type: 'mobile' }];
  if (jobTitle) body.organizations = [{ title: jobTitle }];

  const res = await fetch('https://people.googleapis.com/v1/people:createContact', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create Google Contact');
  }

  const c = await res.json();
  return {
    resourceName: c.resourceName,
    name: c.names?.[0]?.displayName || `${givenName} ${familyName}`.trim(),
    email,
    phone,
    jobTitle,
  };
}
