import React, { useState, useEffect } from "react";
import {
  Plus,
  X,
  Star,
  Code,
  Image as ImageIcon,
  FileText,
  ChevronsUpDown,
} from "lucide-react";

// --- Main App Component ---
export default function App() {
  // --- State Management ---
  const [requestType, setRequestType] = useState("GET");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState([{ id: 1, key: "", value: "" }]);
  const [body, setBody] = useState('{ "key": "value" }');
  const [responseView, setResponseView] = useState("auto");

  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Handlers for UI Interactions ---

  // Add a new empty header row
  const handleAddHeader = () => {
    setHeaders([...headers, { id: Date.now(), key: "", value: "" }]);
  };

  // Remove a header row by its ID
  const handleRemoveHeader = (id) => {
    setHeaders(headers.filter((header) => header.id !== id));
  };

  // Update a header's key or value
  const handleHeaderChange = (id, field, value) => {
    setHeaders(
      headers.map((header) =>
        header.id === id ? { ...header, [field]: value } : header
      )
    );
  };

  // Main function to send the API request
  const handleSendRequest = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    if (!url) {
      setError("Error: Please enter a URL.");
      setIsLoading(false);
      return;
    }

    // Construct headers object for the fetch call
    const fetchHeaders = new Headers();
    fetchHeaders.append("Content-Type", "application/json");
    fetchHeaders.append("Accept", "application/json, image/*, text/plain, */*");

    headers.forEach((header) => {
      if (header.key && header.value) {
        fetchHeaders.append(header.key, header.value);
      }
    });

    // Configure fetch options
    const fetchOptions = {
      method: requestType,
      headers: fetchHeaders,
    };

    if (requestType === "POST") {
      try {
        // Ensure body is valid JSON
        JSON.parse(body);
        fetchOptions.body = body;
      } catch (e) {
        setError(`Error: Invalid JSON in request body.\n${e.message}`);
        setIsLoading(false);
        return;
      }
    }

    try {
      const rawResponse = await fetch(url, fetchOptions);
      const responseClone = rawResponse.clone();
      const contentType = responseClone.headers.get("content-type") || "";

      let responseBody;
      // Process body based on content type
      if (contentType.includes("application/json")) {
        responseBody = await responseClone.json();
      } else if (contentType.startsWith("image/")) {
        const blob = await responseClone.blob();
        responseBody = URL.createObjectURL(blob);
      } else {
        responseBody = await responseClone.text();
      }

      // Extract headers into a simple object
      const responseHeaders = {};
      for (const [key, value] of responseClone.headers.entries()) {
        responseHeaders[key] = value;
      }

      setResponse({
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: responseHeaders,
        body: responseBody,
        contentType: contentType,
      });
    } catch (err) {
      console.error("Fetch Error:", err);
      setError(`Error: Failed to fetch.\n${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Child Components for Cleaner JSX ---

  // Component for a single header input row
  const HeaderRow = ({ header, onChange, onRemove }) => (
    <div className="flex items-center gap-2 mb-2">
      <input
        type="text"
        className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        placeholder="Header Name"
        value={header.key}
        onChange={(e) => onChange(header.id, "key", e.target.value)}
      />
      <input
        type="text"
        className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        placeholder="Header Value"
        value={header.value}
        onChange={(e) => onChange(header.id, "value", e.target.value)}
      />
      <button
        onClick={() => onRemove(header.id)}
        className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full bg-gray-700 hover:bg-gray-600"
      >
        <X size={16} />
      </button>
    </div>
  );

  // Component to display the API response
  const ResponseDisplay = () => {
    if (isLoading) {
      return <div className="text-center p-10 text-gray-400">Sending...</div>;
    }
    if (error) {
      return (
        <pre className="text-red-400 whitespace-pre-wrap break-words p-4">
          {error}
        </pre>
      );
    }
    if (!response) {
      return (
        <div className="text-center p-10 text-gray-500">
          Response will appear here
        </div>
      );
    }

    const renderContent = () => {
      const view =
        responseView === "auto"
          ? response.contentType.startsWith("image/")
            ? "image"
            : response.contentType.includes("json")
            ? "text"
            : "text"
          : responseView;

      switch (view) {
        case "image":
          if (response.contentType.startsWith("image/")) {
            return (
              <img
                src={response.body}
                alt="API Response"
                className="max-w-full h-auto mx-auto rounded-md"
              />
            );
          }
          return (
            <pre className="text-gray-400 p-4">
              Response is not a displayable image.
            </pre>
          );

        case "headers":
          return (
            <pre className="text-green-300 whitespace-pre-wrap break-all p-4 font-mono text-sm">
              {`Status: ${response.status} ${response.statusText}\n\n` +
                Object.entries(response.headers)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join("\n")}
            </pre>
          );

        case "text":
        default:
          const content =
            typeof response.body === "object"
              ? JSON.stringify(response.body, null, 2)
              : response.body;
          return (
            <pre className="text-green-300 whitespace-pre-wrap break-all p-4 font-mono text-sm">
              {content || "(Empty Response)"}
            </pre>
          );
      }
    };

    const statusColor =
      response.status >= 400 ? "text-red-400" : "text-green-400";

    return (
      <div>
        <div
          className={`p-2 bg-gray-800 rounded-t-lg border-b border-gray-600 font-mono text-sm ${statusColor}`}
        >
          Status: {response.status} {response.statusText}
        </div>
        {renderContent()}
      </div>
    );
  };

  // --- Main Render ---
  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen font-sans">
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">API Relay</h1>
          <p className="text-gray-400 mt-2">
            A simple tool to send GET & POST requests and view responses.
          </p>
        </header>

        <main className="space-y-6">
          {/* --- Request Configuration Section --- */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Method Selection */}
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Request Method
                </label>
                <div className="flex bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setRequestType("GET")}
                    className={`w-full py-2 rounded-md text-sm font-semibold transition-colors ${
                      requestType === "GET"
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    GET
                  </button>
                  <button
                    onClick={() => setRequestType("POST")}
                    className={`w-full py-2 rounded-md text-sm font-semibold transition-colors ${
                      requestType === "POST"
                        ? "bg-green-600 text-white"
                        : "text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    POST
                  </button>
                </div>
              </div>
              {/* URL Input */}
              <div className="md:col-span-2">
                <label
                  htmlFor="url-input"
                  className="block text-sm font-medium text-gray-400 mb-2"
                >
                  Endpoint URL
                </label>
                <input
                  type="url"
                  id="url-input"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://api.example.com/data"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* --- Headers Section --- */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <label className="block text-sm font-medium text-gray-400 mb-4">
              Headers
            </label>
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="flex-1 text-xs text-gray-500 font-semibold">
              </div>
              <div className="flex-1 text-xs text-gray-500 font-semibold">
              </div>
              <div className="w-8"></div> {/* Spacer for the delete button */}
            </div>
            <div id="headers-container">
              {headers.map((header) => (
                <HeaderRow
                  key={header.id}
                  header={header}
                  onChange={handleHeaderChange}
                  onRemove={handleRemoveHeader}
                />
              ))}
            </div>
            <button
              onClick={handleAddHeader}
              className="mt-2 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Plus size={16} /> Add Header
            </button>
          </div>

          {/* --- Request Body (for POST, conditionally rendered) --- */}
          {requestType === "POST" && (
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <label
                htmlFor="post-body"
                className="block text-sm font-medium text-gray-400 mb-4"
              >
                Request Body (JSON)
              </label>
              <textarea
                id="post-body"
                rows="6"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder='{ "key": "value" }'
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm"
              ></textarea>
            </div>
          )}

          {/* --- Send Button --- */}
          <div className="text-center">
            <button
              onClick={handleSendRequest}
              disabled={isLoading}
              className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all transform hover:scale-105"
            >
              {isLoading ? "Sending..." : "Send Request"}
            </button>
          </div>

          {/* --- Response Section --- */}
          <div className="bg-gray-800 rounded-lg shadow-lg min-h-[200px]">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Response</h2>
              <div className="flex items-center bg-gray-700 rounded-lg p-1 text-sm">
                <button
                  onClick={() => setResponseView("auto")}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    responseView === "auto"
                      ? "bg-gray-600 text-white"
                      : "text-gray-400 hover:bg-gray-500"
                  }`}
                >
                  Auto
                </button>
                <button
                  onClick={() => setResponseView("text")}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    responseView === "text"
                      ? "bg-gray-600 text-white"
                      : "text-gray-400 hover:bg-gray-500"
                  }`}
                >
                  Text
                </button>
                <button
                  onClick={() => setResponseView("image")}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    responseView === "image"
                      ? "bg-gray-600 text-white"
                      : "text-gray-400 hover:bg-gray-500"
                  }`}
                >
                  Image
                </button>
                <button
                  onClick={() => setResponseView("headers")}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    responseView === "headers"
                      ? "bg-gray-600 text-white"
                      : "text-gray-400 hover:bg-gray-500"
                  }`}
                >
                  Headers
                </button>
              </div>
            </div>
            <div className="response-box">
              <ResponseDisplay />
            </div>
          </div>
        </main>

        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>Converted from a Chrome Extension to a React App.</p>
        </footer>
      </div>
    </div>
  );
}
