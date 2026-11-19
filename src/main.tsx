import './services/polyfills';
import {createRoot} from 'react-dom/client';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import App from './App.tsx';
import './index.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

createRoot(document.getElementById('root')!).render(<App />);
