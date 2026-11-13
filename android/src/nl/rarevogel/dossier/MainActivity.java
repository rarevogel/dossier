package nl.rarevogel.dossier;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Rect;
import android.os.Handler;
import android.os.Looper;
import android.view.PixelCopy;
import android.graphics.pdf.PdfDocument;
import android.os.Environment;
import android.provider.MediaStore;
import org.json.JSONObject;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.OutputStream;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.DisplayCutout;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import java.io.InputStream;

public class MainActivity extends Activity {
    static final String HOST = "dossier.local";
    WebView web;
    FrameLayout frame;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        frame = new FrameLayout(this);
        frame.setBackgroundColor(Color.parseColor("#ffffff"));
        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#e6e8eb"));
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setTextZoom(100);
        web.addJavascriptInterface(new Bridge(), "DossierApp");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (!HOST.equals(u.getHost())) return null;
                String path = u.getPath();
                if (path == null || path.equals("/") || path.isEmpty()) path = "/index.html";
                try {
                    InputStream in = getAssets().open(path.substring(1));
                    return new WebResourceResponse(path.endsWith(".html") ? "text/html" : "application/octet-stream", "utf-8", in);
                } catch (Exception e) {
                    return new WebResourceResponse("text/plain", "utf-8", 404, "Not found", null, null);
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                if (HOST.equals(r.getUrl().getHost()) || !r.isForMainFrame()) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, r.getUrl())); } catch (Exception ignored) {}
                return true;
            }
        });
        frame.addView(web, new FrameLayout.LayoutParams(-1, -1));
        frame.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
            public WindowInsets onApplyWindowInsets(View v, WindowInsets in) {
                int l = in.getSystemWindowInsetLeft(), t = in.getSystemWindowInsetTop(), rr = in.getSystemWindowInsetRight(), b = in.getSystemWindowInsetBottom();
                if (Build.VERSION.SDK_INT >= 28) {
                    DisplayCutout c = in.getDisplayCutout();
                    if (c != null) { l = Math.max(l, c.getSafeInsetLeft()); t = Math.max(t, c.getSafeInsetTop()); rr = Math.max(rr, c.getSafeInsetRight()); b = Math.max(b, c.getSafeInsetBottom()); }
                }
                v.setPadding(l, t, rr, b);
                return in;
            }
        });
        if (Build.VERSION.SDK_INT >= 26) getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        getWindow().setNavigationBarColor(Color.parseColor("#e6e8eb"));
        setContentView(frame);
        frame.requestApplyInsets();
        if (state != null) web.restoreState(state);
        else web.loadUrl("https://" + HOST + "/");
    }

    @Override protected void onSaveInstanceState(Bundle out) { super.onSaveInstanceState(out); web.saveState(out); }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("window.__terug ? String(__terug()) : 'false'", new ValueCallback<String>() {
            public void onReceiveValue(String r) { if (!"\"true\"".equals(r) && !"true".equals(r)) finish(); }
        });
    }

    // ───── PDF: the page moves each A4 sheet under the screen tile by tile; we copy every tile from the
    //       screen (PixelCopy), paste the tiles into one bitmap per sheet and put each sheet on an A4 page ─────
    static final int SAVE_PDF = 42;
    File pendingPdf;
    PdfDocument pdf;
    String pdfName;
    float ratio;          // screen pixels per CSS pixel
    Bitmap sheet;
    Canvas sheetCanvas;
    int pageNo;

    void pdfBegin(String name, float vw, float vh) {
        pdf = new PdfDocument(); pdfName = name; pageNo = 0; sheet = null;
        ratio = web.getWidth() / Math.max(1f, vw);
    }

    void pdfPage(float w, float h) {
        flushSheet();
        int bw = Math.round(w * ratio), bh = Math.round(h * ratio);
        sheet = Bitmap.createBitmap(bw, bh, Bitmap.Config.ARGB_8888);
        sheet.eraseColor(Color.WHITE);
        sheetCanvas = new Canvas(sheet);
    }

    void pdfTile(final float tx, final float ty) {
        final int w = web.getWidth(), h = web.getHeight();
        final Bitmap shot = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        final Runnable paste = new Runnable() { public void run() {
            if (sheetCanvas != null) sheetCanvas.drawBitmap(shot, tx * ratio, ty * ratio, null);
            shot.recycle();
            web.evaluateJavascript("window.__tileDone && __tileDone()", null);
        }};
        if (Build.VERSION.SDK_INT >= 26) {
            int[] loc = new int[2];
            web.getLocationInWindow(loc);
            Rect src = new Rect(loc[0], loc[1], loc[0] + w, loc[1] + h);
            try {
                PixelCopy.request(getWindow(), src, shot, new PixelCopy.OnPixelCopyFinishedListener() {
                    public void onPixelCopyFinished(int result) {
                        if (result != PixelCopy.SUCCESS) web.draw(new Canvas(shot));
                        paste.run();
                    }
                }, new Handler(Looper.getMainLooper()));
                return;
            } catch (Exception ignored) { }
        }
        web.draw(new Canvas(shot));
        paste.run();
    }

    void flushSheet() {
        if (sheet == null || pdf == null) return;
        // A4 at 595 x 842 points; the sheet is scaled to fit and centred
        PdfDocument.Page page = pdf.startPage(new PdfDocument.PageInfo.Builder(595, 842, ++pageNo).create());
        Canvas c = page.getCanvas();
        float k = Math.min(595f / sheet.getWidth(), 842f / sheet.getHeight());
        c.translate((595f - sheet.getWidth() * k) / 2f, 0f);
        c.scale(k, k);
        Paint pt = new Paint(Paint.FILTER_BITMAP_FLAG);
        c.drawBitmap(sheet, 0, 0, pt);
        pdf.finishPage(page);
        sheet.recycle(); sheet = null; sheetCanvas = null;
    }

    void pdfEnd() {
        try {
            flushSheet();
            File f = new File(getCacheDir(), pdfName);
            FileOutputStream out = new FileOutputStream(f);
            pdf.writeTo(out); out.close(); pdf.close(); pdf = null;
            pendingPdf = f;
            Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
            i.addCategory(Intent.CATEGORY_OPENABLE);
            i.setType("application/pdf");
            i.putExtra(Intent.EXTRA_TITLE, pdfName);
            try { startActivityForResult(i, SAVE_PDF); }
            catch (ActivityNotFoundException e) { pdfDone(saveToDownloads(f), null); }
        } catch (Exception e) {
            pdfDone(false, "Could not make the PDF: " + e.getMessage());
        }
    }

    // fallback when there is no file picker: put it in Downloads (Android 10+)
    boolean saveToDownloads(File f) {
        if (Build.VERSION.SDK_INT < 29) return false;
        try {
            ContentValues v = new ContentValues();
            v.put(MediaStore.MediaColumns.DISPLAY_NAME, f.getName());
            v.put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf");
            v.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
            Uri u = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
            return u != null && copy(f, u);
        } catch (Exception e) { return false; }
    }

    boolean copy(File f, Uri u) {
        try {
            OutputStream o = getContentResolver().openOutputStream(u);
            FileInputStream in = new FileInputStream(f);
            byte[] buf = new byte[65536]; int n;
            while ((n = in.read(buf)) > 0) o.write(buf, 0, n);
            in.close(); o.close();
            return true;
        } catch (Exception e) { return false; }
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req != SAVE_PDF) return;
        if (res == RESULT_OK && data != null && data.getData() != null && pendingPdf != null) {
            boolean ok = copy(pendingPdf, data.getData());
            pdfDone(ok, ok ? "PDF saved." : "Saving the PDF failed.");
        } else pdfDone(false, "Cancelled: no PDF saved.");
        if (pendingPdf != null) { pendingPdf.delete(); pendingPdf = null; }
    }

    void pdfDone(final boolean ok, final String msg) {
        final String m = msg != null ? msg : ok ? "PDF saved in Downloads." : "Saving the PDF failed.";
        runOnUiThread(new Runnable() { public void run() {
            web.evaluateJavascript("window.__pdfDone && __pdfDone(" + ok + ", " + JSONObject.quote(m) + ")", null);
        }});
    }

    class Bridge {
        @JavascriptInterface public void pdfBegin(final String name, final float vw, final float vh) { runOnUiThread(new Runnable() { public void run() { MainActivity.this.pdfBegin(name, vw, vh); } }); }
        @JavascriptInterface public void pdfPage(final float w, final float h) { runOnUiThread(new Runnable() { public void run() { MainActivity.this.pdfPage(w, h); } }); }
        @JavascriptInterface public void pdfTile(final float tx, final float ty) { runOnUiThread(new Runnable() { public void run() { MainActivity.this.pdfTile(tx, ty); } }); }
        @JavascriptInterface public void pdfEnd() { runOnUiThread(new Runnable() { public void run() { MainActivity.this.pdfEnd(); } }); }
    }
}
