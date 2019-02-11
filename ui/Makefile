SRCDIR := src
HTMSRCDIR := $(SRCDIR)
JSSRCDIR  := $(SRCDIR)/js
CSSSRCDIR := $(SRCDIR)/css
IMGSRCDIR := $(SRCDIR)/images
HTMBLDDIR := build
CSSBLDDIR := build/css
IMGBLDDIR := build/images
JSBLDDIR  := build/bundle
JSSRCFILES := $(wildcard $(JSSRCDIR)/*.js)
IMGSRCFILES := $(wildcard $(IMGSRCDIR)/*.jpg) $(wildcard $(IMGSRCDIR)/*.png)
HTMSRCFILES := $(wildcard $(HTMSRCDIR)/*.html)
CSSSRCFILES := $(wildcard $(CSSSRCDIR)/*.css)
JSBLDFILES := $(patsubst $(JSSRCDIR)/%.js,$(JSBLDDIR)/%.js,$(JSSRCFILES))
IMGBLDFILES := $(patsubst $(IMGSRCDIR)/%,$(IMGBLDDIR)/%,$(IMGSRCFILES))
HTMBLDFILES := $(patsubst $(HTMSRCDIR)/%,$(HTMBLDDIR)/%,$(HTMSRCFILES))
CSSBLDFILES := $(patsubst $(CSSSRCDIR)/%.css,$(CSSBLDDIR)/%.css,$(CSSSRCFILES))


all:	$(HTMBLDDIR)/index.html

clean:
	rm -rf build/*

deploy: all
	rm -rf release/*
	if [ ! -d release ]; then mkdir release; fi
	mkdir release/css
	mkdir release/images
	mkdir release/bundle
	cp $(HTMBLDDIR)/*.html $(HTMBLDDIR)/play release/
	cp $(IMGBLDDIR)/* release/images/
	cp $(CSSBLDDIR)/*_TIMESTAMP*.css release/css/
	cp $(JSBLDDIR)/index_TIMESTAMP*.js release/bundle/
	tar -czf simple-multisig-wallet-$(shell cat src/js/autoVersion.txt).tar.gz release

$(CSSBLDDIR)/%.css : $(CSSSRCDIR)/%.css
	if [ ! -d $(CSSBLDDIR) ]; then mkdir -p $(CSSBLDDIR); fi
	cp $< $@

#
# this can run every time to check the current git version. if it hasn't
# changed since last build then autoVersion.js is not touched; nevertheless,
# autoVersion.js should not be under git, in order to avoid the need to
# recursively re-create, then re-commit it.
#
.PHONEY :
	./autoVersion.sh

$(JSSRCDIR)/autoVersion.js : .PHONEY

$(IMGBLDDIR)/%.jpg : $(IMGSRCDIR)/%.jpg
	echo "doing .jpgs"
	if [ ! -d $(IMGBLDDIR) ]; then mkdir -p $(IMGBLDDIR); fi
	cp $< $@

$(IMGBLDDIR)/%.png : $(IMGSRCDIR)/%.png
	echo "doing .pngs"
	if [ ! -d $(IMGBLDDIR) ]; then mkdir -p $(IMGBLDDIR); fi
	cp $< $@

$(JSBLDDIR)/%.js : $(JSSRCDIR)/%.js
	if [ ! -d $(JSBLDDIR) ]; then mkdir -p $(JSBLDDIR); fi
	browserify $< -o $@

$(JSBLDDIR)/index.js: $(JSSRCDIR)/index.js $(JSSRCDIR)/autoVersion.js \
	$(JSBLDDIR)/ether.js      \
	$(JSBLDDIR)/smsEther.js   \
	$(JSBLDDIR)/smsUtil.js    \
	$(JSBLDDIR)/common.js     \
	$(JSBLDDIR)/newWallet.js  \
	$(JSBLDDIR)/viewWallet.js \
	$(JSBLDDIR)/loadWallet.js \
	$(JSBLDDIR)/xaction.js
	browserify $< -o $@

$(HTMBLDDIR)/index.html : $(HTMSRCDIR)/index.html \
	$(CSSBLDFILES) \
	$(IMGBLDFILES) \
	$(JSBLDFILES)
	if [ ! -d $(HTMBLDDIR) ]; then mkdir -p $(HTMBLDDIR); fi
	cp $< $@
	./set_timestamp.sh
	cp $(HTMBLDDIR)/index.html $(HTMBLDDIR)/wallet
